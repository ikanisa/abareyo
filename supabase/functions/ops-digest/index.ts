import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
    return new Response(JSON.stringify({ error: await response.text() }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await response.json();
  const summary = body?.choices?.[0]?.message?.content ?? "";

  return new Response(JSON.stringify({ summary }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
