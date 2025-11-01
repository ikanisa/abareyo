import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const normaliseEnvironment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

type SentryConfig = {
  defaultDsn?: string;
  dsnsByEnvironment?: {
    backend?: Record<string, string>;
    shared?: Record<string, string>;
  };
  tracesSampleRate?: number;
  profilesSampleRate?: number;
};

const lookupDsn = (config: SentryConfig | undefined, environment: string) => {
  if (!config) {
    return '';
  }
  const normalised = normaliseEnvironment(environment);
  const backendDsn = config.dsnsByEnvironment?.backend?.[normalised];
  const sharedDsn = config.dsnsByEnvironment?.shared?.[normalised];
  return backendDsn ?? sharedDsn ?? config.defaultDsn ?? '';
};

export const initSentry = (configService: ConfigService) => {
  const environment = configService.get<string>('app.env', 'development');
  const sentryConfig = configService.get<SentryConfig>('observability.sentry');
  const dsn = lookupDsn(sentryConfig, environment);

  if (!dsn) {
    return false;
  }

  const traceRateCandidate = Number(sentryConfig?.tracesSampleRate ?? 0.1);
  const profileRateCandidate = Number(sentryConfig?.profilesSampleRate ?? 0);
  const tracesSampleRate = Number.isNaN(traceRateCandidate) ? 0.1 : traceRateCandidate;
  const profilesSampleRate = Number.isNaN(profileRateCandidate) ? 0 : profileRateCandidate;

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
