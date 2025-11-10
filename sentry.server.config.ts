import * as Sentry from "@sentry/node";

import { resolveSentryConfiguration } from "./src/lib/observability/sentry-config";

const { dsn, environment, release, dist, sampleRates, enabled } = resolveSentryConfiguration("server");

Sentry.init({
  dsn: dsn || undefined,
  enabled,
  environment,
  release: release ?? undefined,
  dist: dist ?? undefined,
  tracesSampleRate: sampleRates.traces,
  profilesSampleRate: sampleRates.profiles,
});

Sentry.configureScope((scope) => {
  scope.setTag("service", "rayon-server");
  if (release) {
    scope.setTag("release", release);
  }
});
