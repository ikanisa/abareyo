import { serverEnv } from "@/config/env";

const normalizeBase = (value: string) => value.replace(/\/+$/, "");

export const resolveBackendBaseUrl = (): string | null => {
  const candidates = [
    process.env.INTERNAL_BACKEND_BASE_URL,
    process.env.BACKEND_BASE_URL,
    serverEnv.NEXT_PUBLIC_BACKEND_URL,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));

  if (candidates.length === 0) {
    if (serverEnv.NODE_ENV !== "production") {
      return "http://localhost:5000/api";
    }
    return null;
  }

  let base = candidates[0]!.trim();
  if (!/^https?:\/\//iu.test(base)) {
    const origin =
      typeof serverEnv.NEXT_PUBLIC_SITE_URL === "string" && serverEnv.NEXT_PUBLIC_SITE_URL
        ? serverEnv.NEXT_PUBLIC_SITE_URL
        : "http://localhost:3000";
    base = base.startsWith("/") ? `${origin}${base}` : `https://${base}`;
  }
  return normalizeBase(base);
};

export const buildBackendApiUrl = (path: string): string | null => {
  const base = resolveBackendBaseUrl();
  if (!base) return null;
  const trimmed = path.replace(/^\/+/, "");
  return `${base}/${trimmed}`;
};
