import { NextResponse } from "next/server";

import { captureException } from "@/lib/observability";

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

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const corsResponse = (status: number) => new NextResponse(null, { status, headers: corsHeaders });

export const errorResponse = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: corsHeaders });

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
  if (req.method === "OPTIONS") {
    return corsResponse(204);
  }

  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed");
  }

  let payload: TelemetryPayload;
  try {
    payload = (await req.json()) as TelemetryPayload;
  } catch (error) {
    return errorResponse(400, "invalid_json");
  }

  const type = resolveType(payload.type);
  if (!type) {
    return errorResponse(400, "invalid_payload");
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
