
const normaliseEnvironment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const getEnvironmentLabel = () =>
  process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ??
  process.env.SENTRY_ENVIRONMENT ??
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

type Target = "client" | "server" | "edge";

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
  ];
  const serverKeys = [
    `SENTRY_DSN_${normalised}`,
    `BACKEND_SENTRY_DSN_${normalised}`,
    "SENTRY_DSN",
  ];

  if (target === "client") {
    return publicKeys;
  }

  if (target === "edge") {
    return [...publicKeys, ...serverKeys];
  }

  return [...serverKeys, ...publicKeys];
};

export const resolveSentryConfiguration = (target: Target) => {
  const environment = getEnvironmentLabel();

  const primaryMap =
    target === "client"
      ? parseMap(process.env.NEXT_PUBLIC_SENTRY_DSN_MAP)
      : {
          ...parseMap(process.env.SENTRY_DSN_MAP),
          ...parseMap(process.env.NEXT_PUBLIC_SENTRY_DSN_MAP),
        };

  const mapped = lookupFromMap(environment, primaryMap);
  const dsn = mapped ?? lookupEnvValue(buildLookupKeys(environment, target));

  return {
    dsn,
    environment,
  } as const;
};

export type SentryConfig = ReturnType<typeof resolveSentryConfiguration>;
