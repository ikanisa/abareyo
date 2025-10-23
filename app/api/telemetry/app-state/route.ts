import { NextRequest, NextResponse } from "next/server";

import {
  buildTelemetryCorsHeaders,
  processTelemetryRequest,
  type TelemetryLogger,
} from "@/lib/telemetry/app-state-handler";

const createLogger = (req: NextRequest): TelemetryLogger => ({
  with(context) {
    const baseContext = {
      ip: req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
      ...context,
    };

    return {
      info(message: string) {
        console.info(`[telemetry] ${message}`, baseContext);
      },
    };
  },
});

const buildOptionsResponse = (req: NextRequest) =>
  new NextResponse(null, {
    status: 204,
    headers: buildTelemetryCorsHeaders(req.headers.get("origin")),
  });

export const POST = (req: NextRequest) =>
  processTelemetryRequest(req, {
    logger: createLogger(req),
    ip: req.ip,
    headers: req.headers,
  });

export const OPTIONS = (req: NextRequest) => buildOptionsResponse(req);
export const dynamic = "force-dynamic";
