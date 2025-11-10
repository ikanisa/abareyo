/* eslint-disable @typescript-eslint/no-require-imports */

const CORRELATION_HEADER = "x-correlation-id";
const REQUEST_ID_HEADER = "x-request-id";
const CORRELATION_COOKIE = "rayon_correlation_id";

const generateCorrelationId = () => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch (error) {
    // Ignore and fall back to Math.random
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
};

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieString = document.cookie;
  if (!cookieString) {
    return null;
  }

  const cookies = cookieString.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split("=");
    if (!rawKey) {
      continue;
    }
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
};

const readServerHeader = (header: string): string | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { headers } = require("next/headers") as typeof import("next/headers");
    const headerList = headers();
    return headerList.get(header);
  } catch (error) {
    return null;
  }
};

const readServerCookie = (name: string): string | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { cookies } = require("next/headers") as typeof import("next/headers");
    return cookies().get(name)?.value ?? null;
  } catch (error) {
    return null;
  }
};

let serverFallbackId: string | null = null;

export const getCorrelationId = (): string => {
  if (typeof window !== "undefined") {
    type GlobalCorrelationScope = typeof window & { __rayonCorrelationId?: string };
    const globalScope = window as GlobalCorrelationScope;
    if (globalScope.__rayonCorrelationId) {
      return globalScope.__rayonCorrelationId;
    }

    const fromCookie = readCookie(CORRELATION_COOKIE);
    const resolved = fromCookie ?? generateCorrelationId();
    globalScope.__rayonCorrelationId = resolved;
    return resolved;
  }

  const headerValue =
    readServerHeader(CORRELATION_HEADER) ?? readServerHeader(REQUEST_ID_HEADER) ?? readServerCookie(CORRELATION_COOKIE);
  if (headerValue) {
    return headerValue;
  }

  if (!serverFallbackId) {
    serverFallbackId = generateCorrelationId();
  }

  return serverFallbackId;
};

export const withCorrelationHeaders = <T extends RequestInit | undefined>(
  init: T,
): T extends undefined ? RequestInit : T => {
  const correlationId = getCorrelationId();
  const headers = new Headers(init?.headers);
  if (!headers.has(CORRELATION_HEADER)) {
    headers.set(CORRELATION_HEADER, correlationId);
  }
  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, correlationId);
  }

  const nextInit: RequestInit = {
    ...init,
    headers,
  };

  return nextInit as T extends undefined ? RequestInit : T;
};

export const CORRELATION_HEADERS = {
  header: CORRELATION_HEADER,
  requestIdHeader: REQUEST_ID_HEADER,
  cookie: CORRELATION_COOKIE,
} as const;
