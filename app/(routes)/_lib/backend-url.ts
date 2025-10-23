import { serverEnv } from "@/config/env";

const FALLBACK_PORT = serverEnv.PORT ?? "3000";

const resolveFallbackOrigin = () => {
  const candidates = [serverEnv.APP_BASE_URL, serverEnv.NEXT_PUBLIC_SITE_URL];
  for (const value of candidates) {
    const candidate = value?.trim();
    if (!candidate) continue;
    const normalized = candidate.startsWith("http") ? candidate : `https://${candidate}`;
    try {
      return new URL(normalized).toString().replace(/\/$/, "");
    } catch {
      continue;
    }
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
