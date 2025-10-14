const FALLBACK_PORT = process.env.PORT ?? "3000";

const resolveFallbackOrigin = () => {
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    return normalized.replace(/\/$/, "");
  }
  return `http://localhost:${FALLBACK_PORT}`;
};

const fallbackOrigin = resolveFallbackOrigin();

const resolveBackendBase = () => {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
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
