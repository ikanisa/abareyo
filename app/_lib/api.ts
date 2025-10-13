export type JsonFetchOptions = RequestInit & { skipJson?: boolean };

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
};

export async function jsonFetch<T = unknown>(path: string, init?: JsonFetchOptions): Promise<T> {
  const url = buildApiUrl(path);
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      if (typeof body?.error === "string") {
        message = body.error;
      }
    } catch (error) {
      console.warn("Failed to parse error payload", error);
    }
    throw new Error(message || "Request failed");
  }
  if (init?.skipJson) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
