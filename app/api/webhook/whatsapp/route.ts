import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { dispatchTelemetryEvent } from "@/lib/observability";
import { setupNodeObservability } from "@/lib/observability/node-observability";

setupNodeObservability("whatsapp-webhook");

const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();

const logEvent = (payload: Record<string, unknown>) => {
  console.info({ event: "whatsapp.webhook", ...payload });
  void dispatchTelemetryEvent({ type: "whatsapp.webhook", ...payload });
};

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    logEvent({ stage: "challenge.accepted" });
    return new NextResponse(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }

  logEvent({ stage: "challenge.rejected", reason: "invalid_token" });
  return NextResponse.json({ error: "invalid_token" }, { status: 403 });
}

const validateSignature = (signature: string | null, payload: string) => {
  if (!appSecret) {
    return true;
  }
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }
  const received = Buffer.from(signature.slice(7), "hex");
  const expected = createHmac("sha256", appSecret).update(payload).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!validateSignature(signature, rawBody)) {
    logEvent({ stage: "ingest.rejected", reason: "invalid_signature" });
    return NextResponse.json({ status: "rejected", reason: "invalid_signature" }, { status: 403 });
  }

  try {
    JSON.parse(rawBody);
  } catch (_error) {
    logEvent({ stage: "ingest.failed", reason: "invalid_json" });
    return NextResponse.json({ status: "rejected", reason: "invalid_json" }, { status: 400 });
  }

  logEvent({ stage: "ingest.accepted", hasSignature: Boolean(signature) });

  // TODO: Persist delivery status updates once storage schema is defined.
  // For now we acknowledge receipt and rely on structured logging for auditing.

  return NextResponse.json({ status: "accepted" }, { status: 202 });
}
