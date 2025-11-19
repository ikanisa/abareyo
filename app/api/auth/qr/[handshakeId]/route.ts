import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/_lib/responses";
import { buildBackendApiUrl } from "@/lib/backend";
import { completeHandshake, readHandshake, summarizeHandshake } from "@/lib/auth/qr-handshake";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { handshakeId: string } }) {
  const handshakeId = params.handshakeId;
  if (!handshakeId) {
    return errorResponse("handshake_id_required", 400);
  }

  const waitParam = Number.parseInt(req.nextUrl.searchParams.get("wait") ?? "0", 10);
  if (waitParam > 0) {
    const delay = Math.min(10000, Math.max(0, waitParam));
    await wait(delay);
  }

  let record = readHandshake(handshakeId);
  if (!record) {
    return errorResponse("handshake_not_found", 404);
  }

  if (record.status === "expired") {
    return NextResponse.json({ data: summarizeHandshake(record) }, { status: 410 });
  }

  if (record.status === "pending") {
    return NextResponse.json({ data: summarizeHandshake(record) });
  }

  if (record.status === "completed") {
    return NextResponse.json({ data: summarizeHandshake(record) });
  }

  if (!record.accessToken) {
    return errorResponse("handshake_missing_token", 400);
  }

  const backendUrl = buildBackendApiUrl("/auth/fan/supabase");
  if (!backendUrl) {
    return errorResponse("backend_unavailable", 503);
  }

  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessToken: record.accessToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    return errorResponse("session_exchange_failed", response.status);
  }

  const setCookie = response.headers.get("set-cookie");
  const payload = await response.json().catch(() => ({}));

  record = completeHandshake(handshakeId) ?? record;

  const result = NextResponse.json({
    data: {
      handshake: summarizeHandshake(record),
      session: payload?.data ?? null,
    },
  });

  if (setCookie) {
    result.headers.set("set-cookie", setCookie);
  }

  return result;
}
