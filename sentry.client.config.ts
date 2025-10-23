import { recordClientException } from "@/lib/observability";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";

if (dsn) {
  console.warn(
    "[observability] Sentry DSN variables detected but the Sentry SDK is disabled. Client errors will be forwarded to the telemetry endpoint instead.",
  );
}

if (typeof window !== "undefined") {
  const registerGlobalHandlers = () => {
    const globalWindow = window as unknown as { __OBSERVABILITY_HANDLERS__?: boolean };

    if (globalWindow.__OBSERVABILITY_HANDLERS__) {
      return;
    }

    globalWindow.__OBSERVABILITY_HANDLERS__ = true;

    window.addEventListener("error", async (event) => {
      await recordClientException(event.error ?? event.message);
    });

    window.addEventListener("unhandledrejection", async (event) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      await recordClientException(reason);
    });
  };

  registerGlobalHandlers();
}
