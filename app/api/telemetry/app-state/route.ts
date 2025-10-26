import { withAxiom, type AxiomRequest } from "next-axiom";

import { processTelemetryRequest } from "@/lib/telemetry/app-state-handler";

const handler = withAxiom((req: AxiomRequest) => {
  const telemetryLogger = {
    with: (context: Record<string, unknown>) => ({
      info: (message: string) => {
        req.log.info({ ...context, message });
      },
    }),
  };
  return processTelemetryRequest(req, { logger: telemetryLogger, ip: req.ip, headers: req.headers });
});

export const POST = handler;
export const OPTIONS = handler;
export const dynamic = "force-dynamic";
