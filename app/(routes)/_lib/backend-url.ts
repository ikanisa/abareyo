import { serverEnv } from "@/config/env";

const FALLBACK_PORT = serverEnv.PORT ?? "3000";

const resolveFallbackOrigin = () => {
  const vercelUrl = serverEnv.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    return normalized.replace(/\/$/, "");
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
  } catch (absoluteError) {
    try {
      return new URL(raw, `${fallbackOrigin}/`).toString().replace(/\/$/, "");
    } catch (relativeError) {
      return fallbackOrigin;
    }
  }
};

const backendBase = resolveBackendBase();

export const buildBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${backendBase}/`).toString();
};
