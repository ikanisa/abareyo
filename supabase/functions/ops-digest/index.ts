import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getOpenAiApiKey, requireEnv } from "../_shared/env.ts";
import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError } from "../_shared/http.ts";

const supabase = getServiceRoleClient();
const OPENAI_API_KEY = requireEnv(getOpenAiApiKey(), "OPENAI_API_KEY");

serve(async (_req) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: sms }, { data: payments }] = await Promise.all([
    supabase
      .from("sms_parsed")
      .select("id, amount, currency, matched_entity, confidence, created_at")
      .gte("created_at", since),
    supabase
      .from("payments")
      .select("id, kind, status, amount, order_id, created_at")
      .gte("created_at", since),
  ]);

  const prompt = [
    "Generate a concise nightly operations digest for Rayon Sports administrators.",
    "Highlight payment totals, notable SMS parsing issues (confidence < 0.7), and open follow-ups.",
    "Provide 3 actionable suggestions max.",
    `SMS_PARSED_DATA=${JSON.stringify(sms ?? [])}`,
    `PAYMENTS_DATA=${JSON.stringify(payments ?? [])}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return jsonError(await response.text(), 502);
  }

  const body = await response.json();
  const summary = body?.choices?.[0]?.message?.content ?? "";

  return json({ summary });
});
