import { NextRequest, NextResponse } from "next/server";

import { processTelemetryRequest } from "@/lib/telemetry/app-state-handler";

// Simple fallback logger when next-axiom is not available
const createFallbackLogger = (_req: NextRequest) => ({
  with: (context: Record<string, unknown>) => ({
    info: (message: string) => {
      // Log to console in development, no-op in production
      if (process.env.NODE_ENV === 'development') {
        console.info('[Telemetry]', { ...context, message });
      }
    },
  }),
});

export async function POST(req: NextRequest) {
  try {
    const telemetryLogger = createFallbackLogger(req);
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return processTelemetryRequest(req, { logger: telemetryLogger, ip, headers: req.headers });
  } catch (error) {
    console.error('[Telemetry] Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS(_req: NextRequest) {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export const dynamic = "force-dynamic";
