import { withAxiom, type AxiomRequest } from "next-axiom";

import {
  corsResponse,
  processTelemetryRequest,
} from "@/lib/telemetry/app-state-handler";

const handler = withAxiom((req: AxiomRequest) =>
  processTelemetryRequest(req, { logger: req.log, ip: req.ip, headers: req.headers }),
);

export const POST = handler;
export const OPTIONS = () => corsResponse(204);

export const runtime = "edge";
export const dynamic = "force-dynamic";
