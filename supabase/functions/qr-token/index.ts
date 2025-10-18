// Route: POST /qr-token
// Body: { pass_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const rawSupabaseUrl = Deno.env.get("SITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const rawServiceKey =
  Deno.env.get("SITE_SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY");
const rawSigningSecret = Deno.env.get("REALTIME_SIGNING_SECRET");

if (!rawSupabaseUrl || !rawServiceKey || !rawSigningSecret) {
  throw new Error("Supabase URL, secret key, or realtime signing secret is missing");
}

const SUPABASE_URL = rawSupabaseUrl;
const SERVICE_KEY = rawServiceKey;
const SIGNING_SECRET = rawSigningSecret;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toBase64Url(input: ArrayBuffer) {
  const bytes = new Uint8Array(input);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: { pass_id?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const passId = payload.pass_id;
  if (!passId) {
    return new Response(JSON.stringify({ error: "missing_pass_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: pass, error: passError } = await supabase
    .from("ticket_passes")
    .select("id")
    .eq("id", passId)
    .single();

  if (passError || !pass) {
    return new Response(JSON.stringify({ error: "pass_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const payloadToSign = `${passId}:${issuedAt}:${nonce}`;
  const signature = await signPayload(payloadToSign);
  const token = `${payloadToSign}.${signature}`;

  await supabase
    .from("ticket_passes")
    .update({ qr_token_hash: signature })
    .eq("id", passId);

  return new Response(JSON.stringify({ token, expires_at: issuedAt + 5 * 60 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
