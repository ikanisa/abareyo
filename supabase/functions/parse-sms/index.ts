// Route: POST /parse-sms
// Body: { sms_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getOpenAiApiKey, requireEnv } from "../_shared/env.ts";
import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

const supabase = getServiceRoleClient();
const OPENAI_API_KEY = requireEnv(getOpenAiApiKey(), "OPENAI_API_KEY");

type ParsedSMS = {
  amount?: number;
  currency?: string;
  payer_mask?: string | null;
  ref?: string | null;
  timestamp?: string | null;
  confidence?: number;
};

type Payload = { sms_id?: string };

function redactForModel(text: string) {
  return text.replace(/\b(\+?\d[\d\s-]{6,})\b/g, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 6) return match;
    const tail = digits.slice(-3);
    return `***${tail}`;
  });
}

async function callOpenAI(text: string): Promise<ParsedSMS> {
  const schema = {
    type: "object",
    properties: {
      amount: { type: "integer" },
      currency: { type: "string" },
      payer_mask: { type: "string" },
      ref: { type: "string" },
      timestamp: { type: "string" },
      confidence: { type: "number" },
    },
    required: ["amount", "currency", "ref", "confidence"],
  };
  const prompt = `Extract mobile-money payment details from the SMS into strict JSON.
Fields: amount (RWF integer), currency, payer_mask (mask numbers), ref, timestamp (if present), confidence 0..1.
SMS: """${redactForModel(text)}"""`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: prompt,
      response_format: {
        type: "json_schema",
        json_schema: { name: "sms_parse", schema },
      },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`openai_error: ${errText}`);
  }

  const body = await res.json();
  const output =
    body?.output?.[0]?.content?.[0]?.text ??
    body?.output_text ??
    body?.choices?.[0]?.message?.content;

  if (typeof output !== "string") return {};
  try {
    return JSON.parse(output) as ParsedSMS;
  } catch {
    return {};
  }
}

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const smsId = parsed.data?.sms_id;
  if (!smsId) {
    return jsonError("missing_sms_id", 400);
  }

  const { data: sms, error: smsError } = await supabase
    .from("sms_raw")
    .select("id, text")
    .eq("id", smsId)
    .single();

  if (smsError || !sms) {
    return jsonError("sms_not_found", 404);
  }

  let parsedSms: ParsedSMS = {};
  try {
    parsedSms = await callOpenAI(sms.text);
  } catch (err) {
    return jsonError((err as Error).message, 502);
  }

  const { data: row, error } = await supabase
    .from("sms_parsed")
    .insert({
      sms_id: sms.id,
      amount: parsedSms.amount ?? 0,
      currency: parsedSms.currency ?? "RWF",
      payer_mask: parsedSms.payer_mask ?? null,
      ref: parsedSms.ref ?? null,
      confidence: parsedSms.confidence ?? 0.5,
    })
    .select()
    .single();

  if (error || !row) {
    return jsonError(error?.message ?? "insert_failed", 500);
  }

  try {
    const url = new URL(req.url);
    url.pathname = "/functions/v1/match-payment";
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_parsed_id: row.id }),
    });
  } catch (_err) {
    // swallow; matching can be retried manually.
  }

  return json({ ok: true, sms_parsed_id: row.id });
});
