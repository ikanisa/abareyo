
const normaliseEnvironment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const getEnvironmentLabel = () =>
  process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ??
  process.env.EXPO_PUBLIC_ENVIRONMENT_LABEL ??
  process.env.SENTRY_ENVIRONMENT ??
  process.env.APP_ENV ??
  process.env.NODE_ENV ??
  "development";

const parseMap = (value: string | undefined) => {
  if (!value) {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Invalid SENTRY_DSN map", error);
    }
  }

  return {} as Record<string, string>;
};

const lookupEnvValue = (keys: string[]) => {
  for (const key of keys) {
    if (!key) continue;
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return "";
};

type Target = "client" | "server" | "edge" | "mobile";

const lookupFromMap = (environment: string, map: Record<string, string>) => {
  const normalised = normaliseEnvironment(environment);
  return (
    map[environment] ??
    map[environment.toLowerCase()] ??
    map[normalised] ??
    map[normalised.toLowerCase()]
  );
};

const buildLookupKeys = (environment: string, target: Target) => {
  const normalised = normaliseEnvironment(environment);
  const publicKeys = [
    `NEXT_PUBLIC_SENTRY_DSN_${normalised}`,
    "NEXT_PUBLIC_SENTRY_DSN",
    `EXPO_PUBLIC_SENTRY_DSN_${normalised}`,
    "EXPO_PUBLIC_SENTRY_DSN",
  ];
  const serverKeys = [
    `SENTRY_DSN_${normalised}`,
    `BACKEND_SENTRY_DSN_${normalised}`,
    "SENTRY_DSN",
  ];

  if (target === "client" || target === "mobile") {
    return publicKeys;
  }

  if (target === "edge") {
    return [...publicKeys, ...serverKeys];
  }

  return [...serverKeys, ...publicKeys];
};

const getReleaseVersion = () => {
  const candidates = [
    process.env.SENTRY_RELEASE,
    process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    process.env.SENTRY_RELEASE_VERSION,
    process.env.NEXT_PUBLIC_APP_VERSION,
    process.env.EXPO_PUBLIC_APP_VERSION,
    process.env.APP_VERSION,
    process.env.GIT_COMMIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
    process.env.CI_COMMIT_SHA,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
};

const getDistribution = () => {
  const candidates = [
    process.env.SENTRY_DIST,
    process.env.NEXT_PUBLIC_SENTRY_DIST,
    process.env.EXPO_PUBLIC_SENTRY_DIST,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
};

const parseSampleRate = (value: string | undefined, fallback: number) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 1) {
    return numeric;
  }
  return fallback;
};

const resolveSampleRates = (target: Target) => {
  const tracesCandidates = [
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  ];
  const replaysSessionCandidates = [
    process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    process.env.EXPO_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  ];
  const replaysErrorCandidates = [
    process.env.SENTRY_REPLAYS_ERROR_SAMPLE_RATE,
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE,
    process.env.EXPO_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE,
  ];
  const profilesCandidates = [process.env.SENTRY_PROFILES_SAMPLE_RATE];

  const traces = tracesCandidates.find((value) => value !== undefined);
  const replaysSession = replaysSessionCandidates.find((value) => value !== undefined);
  const replaysError = replaysErrorCandidates.find((value) => value !== undefined);
  const profiles = profilesCandidates.find((value) => value !== undefined);

  return {
    traces: parseSampleRate(
      traces,
      target === "server" ? 0.05 : target === "mobile" ? 0.25 : 0.1,
    ),
    replaysSession:
      target === "client" || target === "mobile"
        ? parseSampleRate(replaysSession, target === "mobile" ? 0.1 : 0.05)
        : 0,
    replaysError:
      target === "client" || target === "mobile"
        ? parseSampleRate(replaysError, 1)
        : 0,
    profiles: target === "server" ? parseSampleRate(profiles, 0.02) : 0,
  } as const;
};

export const resolveSentryConfiguration = (target: Target) => {
  const environment = getEnvironmentLabel();

  const primaryMap =
    target === "client" || target === "mobile"
      ? {
          ...parseMap(process.env.NEXT_PUBLIC_SENTRY_DSN_MAP),
          ...parseMap(process.env.EXPO_PUBLIC_SENTRY_DSN_MAP),
        }
      : {
          ...parseMap(process.env.SENTRY_DSN_MAP),
          ...parseMap(process.env.NEXT_PUBLIC_SENTRY_DSN_MAP),
          ...parseMap(process.env.EXPO_PUBLIC_SENTRY_DSN_MAP),
        };

  const mapped = lookupFromMap(environment, primaryMap);
  const dsn = mapped ?? lookupEnvValue(buildLookupKeys(environment, target));

  const release = getReleaseVersion();
  const dist = getDistribution();
  const sampleRates = resolveSampleRates(target);

  return {
    dsn,
    environment,
    release,
    dist,
    sampleRates,
    enabled: Boolean(dsn),
  } as const;
};

export type SentryConfig = ReturnType<typeof resolveSentryConfiguration>;
