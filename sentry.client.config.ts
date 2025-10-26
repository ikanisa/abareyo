import * as Sentry from "@sentry/nextjs";

import { resolveSentryConfiguration } from "./src/lib/observability/sentry-config";

const { dsn, environment } = resolveSentryConfiguration("client");
const enabled = Boolean(dsn);

Sentry.init({
  dsn: dsn || undefined,
  enabled,
  environment,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  replaysSessionSampleRate: Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? "0.05"),
  replaysOnErrorSampleRate: Number(process.env.SENTRY_REPLAYS_ERROR_SAMPLE_RATE ?? "1.0"),
});
