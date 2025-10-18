const DEFAULT_SOCKET_PATH = '/ws';
const DEFAULT_TELEMETRY_ENDPOINT = '/api/telemetry/app-state';

const warnings: string[] = [];

const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

const logWarning = (message: string) => {
  if (isProductionBuild) {
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error(message);
  } else {
    console.warn(message);
  }
};

const captureWarning = (message: string) => {
  warnings.push(message);
};

const normaliseOrigin = (value: string) => value.replace(/\/+$/u, '');

const resolveRealtimeOrigin = (backendUrl: string | null) => {
  if (!backendUrl) {
    return null;
  }

  if (!/^https?:\/\//iu.test(backendUrl)) {
    logWarning('NEXT_PUBLIC_BACKEND_URL must be an absolute URL to derive realtime origin.');
    return null;
  }

  const trimmed = backendUrl.replace(/\/?api\/?$/iu, '');
  return normaliseOrigin(trimmed);
};

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const isAbsoluteUrl = (value: string) => /^https?:\/\//iu.test(value);

const isRelativeUrl = (value: string) => value.startsWith('/');

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || null;
const rawSocketPathEnv = process.env.NEXT_PUBLIC_SOCKET_PATH;
const rawTelemetryUrl = process.env.NEXT_PUBLIC_TELEMETRY_URL?.trim();

let backendBaseUrl: string | null = rawBackendUrl;
if (!rawBackendUrl) {
  captureWarning('NEXT_PUBLIC_BACKEND_URL is not set; realtime features will be disabled.');
  backendBaseUrl = null;
} else if (!isAbsoluteUrl(rawBackendUrl)) {
  captureWarning('NEXT_PUBLIC_BACKEND_URL must be an absolute URL including protocol (https://...).');
  backendBaseUrl = null;
}

let socketPath = DEFAULT_SOCKET_PATH;
if (typeof rawSocketPathEnv === 'string') {
  const trimmed = rawSocketPathEnv.trim();
  if (!trimmed) {
    captureWarning('NEXT_PUBLIC_SOCKET_PATH was provided but empty; using /ws.');
  } else {
    socketPath = ensureLeadingSlash(trimmed);
    if (socketPath !== trimmed) {
      captureWarning('NEXT_PUBLIC_SOCKET_PATH should start with `/`; auto-correcting.');
    }
  }
} else {
  captureWarning('NEXT_PUBLIC_SOCKET_PATH is not set; defaulting to /ws.');
}

let telemetryEndpoint = DEFAULT_TELEMETRY_ENDPOINT;
if (!rawTelemetryUrl) {
  captureWarning('NEXT_PUBLIC_TELEMETRY_URL is not set; defaulting to /api/telemetry/app-state.');
} else if (isAbsoluteUrl(rawTelemetryUrl) || isRelativeUrl(rawTelemetryUrl)) {
  telemetryEndpoint = rawTelemetryUrl;
} else {
  captureWarning('NEXT_PUBLIC_TELEMETRY_URL must be an absolute URL or begin with `/`; defaulting to safe endpoint.');
}

warnings.forEach(logWarning);

export const clientConfig = Object.freeze({
  backendBaseUrl,
  realtimeOrigin: resolveRealtimeOrigin(backendBaseUrl),
  socketPath,
  telemetryEndpoint,
});

export type ClientConfig = typeof clientConfig;
