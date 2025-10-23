import { withAxiom, type AxiomRequest } from "next-axiom";
import { NextRequest, NextResponse } from "next/server";

import {
  buildTelemetryCorsHeaders,
  processTelemetryRequest,
} from "@/lib/telemetry/app-state-handler";

const handler = withAxiom((req: AxiomRequest) =>
  processTelemetryRequest(req, { logger: req.log, ip: req.ip, headers: req.headers }),
);

export const POST = handler;
export const OPTIONS = () => corsResponse(204);
export const dynamic = "force-dynamic";
