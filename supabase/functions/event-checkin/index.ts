import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { getRealtimeSigningSecret, requireEnv } from "../_shared/env.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";
import {
  createPayload,
  ensureTokenFresh,
  parseSignedToken,
  verifySignature,
} from "../_shared/signing.ts";

type Payload = {
  event_id?: string;
  token?: string;
};

const SIGNING_SECRET = requireEnv(getRealtimeSigningSecret(), "REALTIME_SIGNING_SECRET");
const supabase = getServiceRoleClient();

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const { event_id, token } = parsed.data ?? {};

  if (!event_id) {
    return jsonError("missing_event_id", 400);
  }

  if (!token) {
    return jsonError("missing_token", 400);
  }

  const parsedToken = parseSignedToken(token);
  if (!parsedToken) {
    return jsonError("invalid_token", 401);
  }

  if (!ensureTokenFresh(parsedToken.issuedAt)) {
    return jsonError("token_expired", 401);
  }

  const payload = createPayload(parsedToken.passId, parsedToken.issuedAt, parsedToken.nonce);
  const signatureValid = await verifySignature(SIGNING_SECRET, payload, parsedToken.signature);
  if (!signatureValid) {
    return jsonError("invalid_token", 401);
  }

  const { data: pass, error: passError } = await supabase
    .from("ticket_passes")
    .select("id, qr_token_hash, state, order:ticket_orders(match_id)")
    .eq("id", parsedToken.passId)
    .maybeSingle();

  if (passError) {
    return jsonError(passError.message, 500);
  }

  if (!pass) {
    return jsonError("token_not_recognised", 404);
  }

  const matchId = pass.order?.match_id;
  if (!matchId || matchId !== event_id) {
    return jsonError("event_mismatch", 400);
  }

  if (!pass.qr_token_hash || pass.qr_token_hash !== parsedToken.signature) {
    return jsonError("invalid_token", 401);
  }

  if (pass.state !== "active") {
    return jsonError("token_not_active", 409);
  }

  const { data: updatedPass, error: markUsedError } = await supabase
    .from("ticket_passes")
    .update({ state: "used", qr_token_hash: null })
    .eq("id", parsedToken.passId)
    .eq("qr_token_hash", parsedToken.signature)
    .eq("state", "active")
    .select("id")
    .maybeSingle();

  if (markUsedError) {
    return jsonError(markUsedError.message, 500);
  }

  if (!updatedPass) {
    return jsonError("token_already_used", 409);
  }

  const { data: checkin, error } = await supabase
    .from("event_checkins")
    .insert({
      event_id,
      token,
    })
    .select("id")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return json({ ok: true, checkin_id: checkin?.id ?? null });
});
