import { NextResponse } from "next/server";

import { captureException } from "@/lib/observability";
import { buildCorsHeaders } from "@/lib/server/origins";

export type TelemetryPayload = {
  type?: string;
  description?: string;
  stack?: string | null;
  timestamp?: number;
  [key: string]: unknown;
};

export type TelemetryLogger = {
  with: (context: Record<string, unknown>) => { info: (message: string) => void };
};

export type TelemetryContext = {
  logger: TelemetryLogger;
  ip?: string | null;
  headers: Headers;
};

export const buildTelemetryCorsHeaders = (origin: string | null) =>
  buildCorsHeaders({
    requestOrigin: origin,
    allowedMethods: "POST,OPTIONS",
    allowedHeaders: "Content-Type",
  });

const resolveType = (value: TelemetryPayload["type"]) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const processTelemetryRequest = async (
  req: Request,
  { logger, ip, headers }: TelemetryContext,
) => {
  const origin = headers.get("origin");
  const corsHeaders = buildTelemetryCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return NextResponse.json({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders });
  }

  let payload: TelemetryPayload;
  try {
    payload = (await req.json()) as TelemetryPayload;
  } catch (_error) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: corsHeaders });
  }

  const type = resolveType(payload.type);
  if (!type) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400, headers: corsHeaders });
  }

  const event = {
    ...payload,
    type,
    timestamp: typeof payload.timestamp === "number" ? payload.timestamp : Date.now(),
    ip: ip ?? headers.get("x-forwarded-for") ?? "unknown",
  };

  logger.with({ event }).info("telemetry_event");

  if (type === "client-error" && payload.description) {
    captureException(new Error(String(payload.description)), {
      extra: { telemetry: payload },
    });
  }

  return NextResponse.json({ received: true }, { status: 202, headers: corsHeaders });
};
