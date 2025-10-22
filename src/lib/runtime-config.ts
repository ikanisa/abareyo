import { serverEnv } from "@/config/env";

const DEFAULT_PORT = serverEnv.PORT ?? "3000";

const normalizeUrl = (raw: string, defaultProtocol: "http" | "https" = "https") => {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${defaultProtocol}://${trimmed}`;
};

export const getSiteUrl = (): string => {
  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || siteUrl.trim().length === 0) {
    return `http://localhost:${DEFAULT_PORT}`;
  }
  return normalizeUrl(siteUrl, "https");
};

export const getBackendBaseUrl = (): string => {
  const raw = serverEnv.NEXT_PUBLIC_BACKEND_URL;
  const fallback = getSiteUrl();
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch (absoluteError) {
    try {
      return new URL(raw, `${fallback}/`).toString().replace(/\/$/, "");
    } catch (relativeError) {
      return fallback;
    }
  }
};

export const runtimeConfig = {
  siteUrl: getSiteUrl(),
  backendUrl: getBackendBaseUrl(),
};

export type RuntimeConfig = typeof runtimeConfig;
