import * as Sentry from "@sentry/react";

import { resolveSentryConfiguration } from "./src/lib/observability/sentry-config";
import { getCorrelationId } from "./src/lib/observability/correlation";

const { dsn, environment, release, dist, sampleRates, enabled } = resolveSentryConfiguration("client");

Sentry.init({
  dsn: dsn || undefined,
  enabled,
  environment,
  release: release ?? undefined,
  dist: dist ?? undefined,
  tracesSampleRate: sampleRates.traces,
  replaysSessionSampleRate: sampleRates.replaysSession,
  replaysOnErrorSampleRate: sampleRates.replaysError,
});

Sentry.configureScope((scope) => {
  scope.setTag("service", "rayon-web");
  const correlationId = getCorrelationId();
  if (correlationId) {
    scope.setTag("correlation_id", correlationId);
  }
  if (release) {
    scope.setTag("release", release);
  }
});
