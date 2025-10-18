// Route: POST /parse-sms
// Body: { sms_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const rawSupabaseUrl = Deno.env.get("SITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const rawServiceKey =
  Deno.env.get("SITE_SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!rawSupabaseUrl || !rawServiceKey || !OPENAI_API_KEY) {
  throw new Error("Supabase URL, secret key, or OPENAI_API_KEY is missing");
}

type ParsedSMS = {
  amount?: number;
  currency?: string;
  payer_mask?: string | null;
  ref?: string | null;
  timestamp?: string | null;
  confidence?: number;
};

const supabase = createClient(rawSupabaseUrl, rawServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { sms_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const smsId = body.sms_id;
  if (!smsId) {
    return new Response(JSON.stringify({ error: "missing_sms_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: sms, error: smsError } = await supabase
    .from("sms_raw")
    .select("id, text")
    .eq("id", smsId)
    .single();

  if (smsError || !sms) {
    return new Response(JSON.stringify({ error: "sms_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let parsed: ParsedSMS = {};
  try {
    parsed = await callOpenAI(sms.text);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: row, error } = await supabase
    .from("sms_parsed")
    .insert({
      sms_id: sms.id,
      amount: parsed.amount ?? 0,
      currency: parsed.currency ?? "RWF",
      payer_mask: parsed.payer_mask ?? null,
      ref: parsed.ref ?? null,
      confidence: parsed.confidence ?? 0.5,
    })
    .select()
    .single();

  if (error || !row) {
    return new Response(JSON.stringify({ error: error?.message ?? "insert_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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

  return new Response(JSON.stringify({ ok: true, sms_parsed_id: row.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
