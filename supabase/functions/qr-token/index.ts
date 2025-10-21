// Route: POST /qr-token
// Body: { pass_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getRealtimeSigningSecret, requireEnv } from "../_shared/env.ts";
import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

const SIGNING_SECRET = requireEnv(getRealtimeSigningSecret(), "REALTIME_SIGNING_SECRET");
const supabase = getServiceRoleClient();

type Payload = { pass_id?: string };

const toBase64Url = (input: ArrayBuffer) => {
  const bytes = new Uint8Array(input);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const signPayload = async (payload: string) => {
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
};

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const passId = parsed.data?.pass_id;
  if (!passId) {
    return jsonError("missing_pass_id", 400);
  }

  const { data: pass, error: passError } = await supabase
    .from("ticket_passes")
    .select("id")
    .eq("id", passId)
    .single();

  if (passError || !pass) {
    return jsonError("pass_not_found", 404);
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

  return json({ token, expires_at: issuedAt + 5 * 60 });
});
