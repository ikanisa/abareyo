// Route: POST /qr-token
// Body: { pass_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getRealtimeSigningSecret, requireEnv } from "../_shared/env.ts";
import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";
import { issueSignedToken, TOKEN_TTL_SECONDS } from "../_shared/signing.ts";

const SIGNING_SECRET = requireEnv(getRealtimeSigningSecret(), "REALTIME_SIGNING_SECRET");
const supabase = getServiceRoleClient();

type Payload = { pass_id?: string };

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

  const { token, signature, issuedAt, expiresAt } = await issueSignedToken(SIGNING_SECRET, passId);

  await supabase
    .from("ticket_passes")
    .update({ qr_token_hash: signature })
    .eq("id", passId);

  return json({ token, expires_at: expiresAt ?? issuedAt + TOKEN_TTL_SECONDS });
});
