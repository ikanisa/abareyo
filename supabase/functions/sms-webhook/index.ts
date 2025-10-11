// Route: POST /sms/webhook
// Header: Authorization: Bearer ${SMS_WEBHOOK_TOKEN}
// Body: { from_msisdn: string, text: string, received_at?: string }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = Deno.env.get("SMS_WEBHOOK_TOKEN")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!bearer || bearer !== TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { from_msisdn, text, received_at } = payload as {
    from_msisdn?: string;
    text?: string;
    received_at?: string;
  };
  if (!from_msisdn || !text) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("sms_raw")
    .insert({
      from_msisdn,
      text,
      received_at: received_at ?? new Date().toISOString(),
      source: "gsm-daemon",
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  url.pathname = "/functions/v1/parse-sms";

  let parsed: unknown = null;
  try {
    const fanoutResp = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_id: data.id }),
    });
    parsed = await fanoutResp.json().catch(() => null);
  } catch (err) {
    parsed = { error: (err as Error).message };
  }

  return new Response(JSON.stringify({ ok: true, sms_id: data.id, parsed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
