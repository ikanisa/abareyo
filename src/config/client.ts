const normaliseOrigin = (value: string) => value.replace(/\/+$/u, '');

const resolveRealtimeOrigin = (backendUrl: string | null) => {
  if (!backendUrl) {
    return null;
  }

  if (!/^https?:\/\//iu.test(backendUrl)) {
    console.warn('NEXT_PUBLIC_BACKEND_URL must be an absolute URL to derive realtime origin.');
    return null;
  }

  const trimmed = backendUrl.replace(/\/?api\/?$/iu, '');
  return normaliseOrigin(trimmed);
};

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const isAbsoluteUrl = (value: string) => /^https?:\/\//iu.test(value);

const isRelativeUrl = (value: string) => value.startsWith('/');

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? process.env.NODE_ENV ?? 'development';

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || null;
const rawSocketPathEnv = process.env.NEXT_PUBLIC_SOCKET_PATH;
const rawSocketPath = (rawSocketPathEnv ?? '/ws').trim();
const rawTelemetryUrl = process.env.NEXT_PUBLIC_TELEMETRY_URL?.trim();

if (!rawSocketPathEnv || rawSocketPath.length === 0) {
  const message = 'NEXT_PUBLIC_SOCKET_PATH must be provided and non-empty.';
  if (environment === 'production') {
    throw new Error(message);
  }
  console.warn(`${message} Falling back to /ws for this build.`);
}

if (!rawBackendUrl) {
  const message = 'NEXT_PUBLIC_BACKEND_URL is not set; realtime features will be disabled.';
  if (environment === 'production') {
    throw new Error('NEXT_PUBLIC_BACKEND_URL must be provided in production deployments.');
  }
  console.warn(message);
} else if (!isAbsoluteUrl(rawBackendUrl)) {
  const message = 'NEXT_PUBLIC_BACKEND_URL must be an absolute URL including protocol (https://...).';
  if (environment === 'production') {
    throw new Error(message);
  }
  console.warn(message);
}

const socketPathSource = rawSocketPath.length > 0 ? rawSocketPath : '/ws';
const socketPath = ensureLeadingSlash(socketPathSource);
if (socketPath !== socketPathSource) {
  const message = 'NEXT_PUBLIC_SOCKET_PATH must start with a `/`. Auto-correcting for this build.';
  if (environment === 'production') {
    throw new Error(message);
  }
  console.warn(message);
}

const telemetryEndpoint = rawTelemetryUrl || '/api/telemetry/app-state';
if (!rawTelemetryUrl) {
  const message = 'NEXT_PUBLIC_TELEMETRY_URL is not set; defaulting to /api/telemetry/app-state.';
  if (environment === 'production') {
    throw new Error('NEXT_PUBLIC_TELEMETRY_URL must be provided in production deployments.');
  }
  console.warn(message);
} else if (!isAbsoluteUrl(rawTelemetryUrl) && !isRelativeUrl(rawTelemetryUrl)) {
  throw new Error('NEXT_PUBLIC_TELEMETRY_URL must be an absolute URL or begin with `/`.');
}

export const clientConfig = Object.freeze({
  backendBaseUrl: rawBackendUrl,
  realtimeOrigin: resolveRealtimeOrigin(rawBackendUrl),
  socketPath,
  telemetryEndpoint,
});

export type ClientConfig = typeof clientConfig;
