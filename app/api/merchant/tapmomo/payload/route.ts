import { NextRequest } from "next/server";
import { createHmac, randomUUID } from "crypto";

import { requireAuthUser } from "@/app/_lib/auth";
import { errorResponse, successResponse } from "@/app/_lib/responses";
import { getSupabase } from "@/app/_lib/supabase";

const DEFAULT_TTL_SECONDS = 60;

const encodePayload = (input: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(input), "utf8").toString("base64");

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const auth = await requireAuthUser(req, supabase);
  if ("response" in auth) {
    return auth.response;
  }

  if (!supabase) {
    return errorResponse("supabase_config_missing", 500);
  }

  const userId = auth.user.id;
  const { data: merchant, error } = await supabase
    .from("tapmomo_merchants")
    .select("id, merchant_account, signing_key, nonce_ttl_seconds, aid")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }

  if (!merchant) {
    return errorResponse("merchant_not_registered", 404);
  }

  const nonceTtlSeconds = merchant.nonce_ttl_seconds ?? DEFAULT_TTL_SECONDS;
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + nonceTtlSeconds;
  const nonce = randomUUID();
  const payloadToSign = [merchant.merchant_account, nonce, issuedAt, expiresAt].join(":");
  const signature = createHmac("sha256", merchant.signing_key)
    .update(payloadToSign)
    .digest("base64url");
  const encoded = encodePayload({
    merchant: merchant.merchant_account,
    nonce,
    issuedAt,
    expiresAt,
    signature,
  });

  return successResponse({
    aid: merchant.aid,
    payload: encoded,
    nonce,
    issuedAt,
    expiresAt,
    signature,
    ttlSeconds: nonceTtlSeconds,
  });
}
