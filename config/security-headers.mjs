const DEFAULT_CONNECT_SOURCES = new Set([
  "'self'",
  'https://*.ingest.sentry.io',
  'https://api.axiom.co',
]);

const normaliseOrigin = (value) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch (error) {
    return null;
  }
};

const appendOrigin = (set, value) => {
  const origin = normaliseOrigin(value);
  if (origin) {
    set.add(origin);
  }
};

export const buildConnectSources = (env = process.env) => {
  const connectSources = new Set(DEFAULT_CONNECT_SOURCES);

  appendOrigin(connectSources, env.NEXT_PUBLIC_BACKEND_URL);
  appendOrigin(connectSources, env.NEXT_PUBLIC_TELEMETRY_URL);
  appendOrigin(connectSources, env.NEXT_PUBLIC_SITE_URL);

  return Array.from(connectSources);
};

export const buildContentSecurityPolicy = (env = process.env) => {
  const connectSrc = buildConnectSources(env).join(' ');

  const nodeEnv = (env.NODE_ENV ?? process.env.NODE_ENV)?.toLowerCase();
  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (nodeEnv !== 'production') {
    scriptSources.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];

  return directives.join('; ');
};

export const buildSecurityHeaders = (env = process.env) => {
  const headers = [
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(env),
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
  ];

  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
};

export const applySecurityHeaders = (response, env = process.env) => {
  for (const header of buildSecurityHeaders(env)) {
    response.headers.set(header.key, header.value);
  }
  return response;
};

