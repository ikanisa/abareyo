import { getBackendBaseUrl } from "@/lib/runtime-config";

const backendBase = getBackendBaseUrl();

export const buildBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${backendBase}/`).toString();
};
