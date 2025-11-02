import { serverEnv } from "@/config/env";

const FALLBACK_PORT = serverEnv.PORT ?? "3000";

const resolveFallbackOrigin = () => {
  if (serverEnv.APP_BASE_URL) {
    return serverEnv.APP_BASE_URL;
  }
  return `http://localhost:${FALLBACK_PORT}`;
};

const fallbackOrigin = resolveFallbackOrigin();

const resolveBackendBase = () => {
  const raw = serverEnv.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!raw) {
    return fallbackOrigin;
  }

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch (_absoluteError) {
    try {
      return new URL(raw, `${fallbackOrigin}/`).toString().replace(/\/$/, "");
    } catch (_relativeError) {
      return fallbackOrigin;
    }
  }
};

const backendBase = resolveBackendBase();

export const buildBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${backendBase}/`).toString();
};
