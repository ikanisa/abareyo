import {
  corsResponse,
  processTelemetryRequest,
} from "@/lib/telemetry/app-state-handler";

const createLogger = () => ({
  with: (context: Record<string, unknown>) => ({
    info: (message: string) => {
      if (process.env.NODE_ENV !== "test") {
        console.info(`[telemetry] ${message}`, context);
      }
    },
  }),
});

export const POST = async (req: Request) => {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;

  return processTelemetryRequest(req, {
    logger: createLogger(),
    ip,
    headers,
  });
};
export const OPTIONS = () => corsResponse(204);

export const runtime = "edge";
export const dynamic = "force-dynamic";
