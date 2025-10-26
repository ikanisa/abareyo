const DEFAULT_LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

type OriginInput = string | null | undefined;

const splitCandidates = (value: OriginInput): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const normaliseOrigin = (value: OriginInput): string | null => {
  if (!value) {
    return null;
  }

  if (value === "*") {
    return "*";
  }

  const attempt = (candidate: string) => {
    try {
      const url = new URL(candidate);
      return `${url.protocol}//${url.host}`;
    } catch {
      return null;
    }
  };

  const direct = attempt(value);
  if (direct) {
    return direct;
  }

  // Allow bare hostnames by assuming https://
  return attempt(`https://${value}`);
};

const gatherOrigins = (...sources: OriginInput[]): Set<string> => {
  const origins = new Set<string>();

  for (const source of sources) {
    for (const entry of splitCandidates(source)) {
      if (entry === "*") {
        return new Set(["*"]);
      }
      const normalised = normaliseOrigin(entry);
      if (normalised) {
        origins.add(normalised);
      }
    }
  }

  return origins;
};

export const getAllowedOrigins = (): string[] => {
  const configured = gatherOrigins(
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_SUPABASE_URL,
  );

  if (configured.has("*")) {
    return ["*"];
  }

  const defaults = gatherOrigins(...DEFAULT_LOCAL_ORIGINS);
  for (const origin of configured) {
    defaults.add(origin);
  }

  return Array.from(defaults);
};

export const getAllowedHosts = (): string[] => {
  const origins = getAllowedOrigins();
  if (origins.length === 1 && origins[0] === "*") {
    return [];
  }

  const hosts = new Set<string>();
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      hosts.add(url.host.toLowerCase());
    } catch {
      // Ignore invalid origins (already normalised but guard anyway).
    }
  }

  return Array.from(hosts);
};

type CorsHeaderOptions = {
  requestOrigin?: OriginInput;
  allowedMethods?: string;
  allowedHeaders?: string;
  allowCredentials?: boolean;
};

export const selectCorsOrigin = (requestOrigin: OriginInput): string => {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    return "*";
  }

  if (allowed.length === 1 && allowed[0] === "*") {
    return "*";
  }

  const origin = normaliseOrigin(requestOrigin);
  if (origin && allowed.includes(origin)) {
    return origin;
  }

  return allowed[0] ?? "*";
};

export const buildCorsHeaders = ({
  requestOrigin = null,
  allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders = "Content-Type,Authorization",
  allowCredentials = false,
}: CorsHeaderOptions = {}): Record<string, string> => {
  const origin = selectCorsOrigin(requestOrigin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Allow-Headers": allowedHeaders,
  };

  if (allowCredentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  if (origin !== "*") {
    headers.Vary = "Origin";
  }

  return headers;
};
