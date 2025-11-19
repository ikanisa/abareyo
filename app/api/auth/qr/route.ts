import { NextResponse } from "next/server";

import { errorResponse } from "@/app/_lib/responses";
import { createHandshake, summarizeHandshake } from "@/lib/auth/qr-handshake";

export const runtime = "nodejs";

export async function POST() {
  const { record, qrPayload } = createHandshake();

  return NextResponse.json({
    data: {
      handshake: summarizeHandshake(record),
      qrPayload,
    },
  });
}

export async function GET() {
  return errorResponse("handshake_id_required", 400);
}
