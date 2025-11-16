import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/_lib/responses";
import { getServiceSupabaseClient } from "@/app/api/_lib/supabase";
import { confirmHandshake, readHandshake, summarizeHandshake } from "@/lib/auth/qr-handshake";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { handshakeId, secret, accessToken, refreshToken } = (await req.json().catch(() => ({}))) as {
    handshakeId?: string;
    secret?: string;
    accessToken?: string;
    refreshToken?: string | null;
  };

  if (!handshakeId || !secret || !accessToken) {
    return errorResponse("handshake_payload_invalid", 400);
  }

  const record = readHandshake(handshakeId);
  if (!record) {
    return errorResponse("handshake_not_found", 404);
  }

  if (record.status === "expired") {
    return errorResponse("handshake_expired", 410);
  }

  if (record.status !== "pending") {
    return errorResponse("handshake_already_consumed", 409);
  }

  let supabase;
  try {
    supabase = getServiceSupabaseClient();
  } catch (error) {
    console.error("qr.consume.supabase_unavailable", error);
    return errorResponse("supabase_unavailable", 503);
  }
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    return errorResponse("invalid_supabase_token", 401);
  }

  const updated = confirmHandshake(handshakeId, secret, {
    userId: data.user.id,
    accessToken,
    refreshToken,
  });

  if (!updated) {
    return errorResponse("handshake_verification_failed", 401);
  }

  return NextResponse.json({ data: summarizeHandshake(updated) });
}
