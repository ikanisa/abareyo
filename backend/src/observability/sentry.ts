import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const normaliseEnvironment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

const lookupDsn = (environment: string) => {
  const normalised = normaliseEnvironment(environment);
  return (
    process.env[`BACKEND_SENTRY_DSN_${normalised}`] ??
    process.env[`SENTRY_DSN_${normalised}`] ??
    process.env.SENTRY_DSN ??
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    ''
  );
};

export const initSentry = (configService: ConfigService) => {
  const environment = configService.get<string>('app.env', 'development');
  const dsn = lookupDsn(environment);

  if (!dsn) {
    return false;
  }

  const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1');
  const profilesSampleRate = Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0');

  Sentry.init({
    dsn,
    environment,
    enabled: true,
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0.1 : tracesSampleRate,
    profilesSampleRate: Number.isNaN(profilesSampleRate) ? 0 : profilesSampleRate,
    integrations: [nodeProfilingIntegration()],
  });

  Sentry.setTags({
    service: 'rayon-backend',
  });

  return true;
};

export const captureWithSentryScope = (error: unknown, context?: { handler?: string; controller?: string }) => {
  Sentry.captureException(error, (scope) => {
    if (context?.handler) {
      scope.setTag('handler', context.handler);
    }
    if (context?.controller) {
      scope.setTag('controller', context.controller);
    }
    return scope;
  });
};
