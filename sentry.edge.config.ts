import { resolveSentryConfiguration } from "./src/lib/observability/sentry-config";

const { dsn, environment } = resolveSentryConfiguration("edge");

if (dsn) {
  console.warn(
    `Sentry edge runtime DSN detected for ${environment}, but edge instrumentation is disabled after removing vercel-edge adapters.`,
  );
} else if (process.env.NODE_ENV !== "production") {
  console.info("Sentry edge runtime instrumentation is disabled; no DSN configured.");
}
