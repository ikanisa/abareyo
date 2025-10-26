import * as Sentry from "@sentry/nextjs";

import { resolveSentryConfiguration } from "./src/lib/observability/sentry-config";

const { dsn, environment } = resolveSentryConfiguration("edge");
const enabled = Boolean(dsn);

Sentry.init({
  dsn: dsn || undefined,
  enabled,
  environment,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
});
