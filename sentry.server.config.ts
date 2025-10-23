import { captureException } from "@/lib/observability";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";

if (dsn) {
  console.warn(
    "[observability] Sentry DSN variables detected but the Sentry SDK is disabled. Server errors will be logged locally and forwarded to telemetry handlers.",
  );
}

const registrationFlag = Symbol.for("observability.process-handlers");
const globalRegistry = globalThis as Record<string | symbol, unknown>;

if (!globalRegistry[registrationFlag]) {
  globalRegistry[registrationFlag] = true;

  process.on("uncaughtException", (error) => {
    captureException(error, { origin: "uncaughtException" });
  });

  process.on("unhandledRejection", (reason) => {
    captureException(reason, { origin: "unhandledRejection" });
  });
}
