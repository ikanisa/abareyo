import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const CORRELATION_TAG = 'correlation_id';

const readExpoExtra = () => {
  const expoConfig = (Constants.expoConfig ?? {}) as { extra?: Record<string, unknown> };
  const manifestExtra = (Constants.manifest?.extra ?? {}) as Record<string, unknown>;
  return {
    ...(expoConfig.extra ?? {}),
    ...manifestExtra,
  } as Record<string, unknown>;
};

const normaliseEnvironment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const parseDsnMap = (raw: unknown): Record<string, string> => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  if (Array.isArray(raw)) {
    return {};
  }

  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      entries[normaliseEnvironment(key)] = value.trim();
    }
  }
  return entries;
};

const lookupEnvValue = (environment: string, map: Record<string, string>, ...values: (string | undefined)[]) => {
  const normalised = normaliseEnvironment(environment);
  const direct = map[environment] ?? map[environment.toLowerCase()] ?? map[normalised];
  if (direct) {
    return direct;
  }

  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
};

const parseSampleRate = (candidate: unknown, fallback: number) => {
  const numeric = typeof candidate === 'string' ? Number(candidate) : Number(candidate ?? NaN);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 1) {
    return numeric;
  }
  return fallback;
};

export type MobileSentryOptions = {
  serviceName?: string;
};

export const initMobileSentry = (options: MobileSentryOptions = {}) => {
  const extra = readExpoExtra();
  const environment =
    (extra.environmentLabel as string | undefined)?.trim() ??
    process.env.EXPO_PUBLIC_ENVIRONMENT_LABEL ??
    process.env.SENTRY_ENVIRONMENT ??
    process.env.APP_ENV ??
    'development';

  const dsnMap = parseDsnMap(extra.sentryDsnMap ?? extra.sentryDsns);
  const rawDsn = lookupEnvValue(
    environment,
    dsnMap,
    extra.sentryDsn as string | undefined,
    process.env.EXPO_PUBLIC_SENTRY_DSN,
    process.env.SENTRY_DSN,
  );

  const releaseCandidates = [
    extra.sentryRelease as string | undefined,
    process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    process.env.SENTRY_RELEASE,
    process.env.APP_VERSION,
    process.env.GIT_COMMIT_SHA,
  ];

  const release = releaseCandidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
  const dist =
    (extra.sentryDist as string | undefined)?.trim() ??
    process.env.EXPO_PUBLIC_SENTRY_DIST ??
    process.env.SENTRY_DIST ??
    undefined;

  const tracesSampleRate = parseSampleRate(
    extra.sentryTracesSampleRate ?? process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    0.25,
  );
  const profilesSampleRate = parseSampleRate(
    extra.sentryProfilesSampleRate ?? process.env.SENTRY_PROFILES_SAMPLE_RATE,
    0.1,
  );

  const enabled = rawDsn.trim().length > 0;

  Sentry.init({
    dsn: enabled ? rawDsn : undefined,
    enabled,
    environment,
    release: release ?? undefined,
    dist,
    tracesSampleRate,
    profilesSampleRate,
    enableNative: true,
    enableNativeCrashHandling: true,
    autoSessionTracking: true,
  });

  Sentry.configureScope((scope) => {
    scope.setTag('service', options.serviceName ?? 'rayon-mobile');
    if (release) {
      scope.setTag('release', release);
    }
  });
};

export const setMobileCorrelationId = (correlationId: string | null | undefined) => {
  if (!correlationId) {
    return;
  }
  Sentry.configureScope((scope) => {
    scope.setTag(CORRELATION_TAG, correlationId);
  });
};
