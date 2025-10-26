import { clientEnv } from '@/config/env';

const FALLBACK_BASE = '/api';
const rawBaseUrl = clientEnv.NEXT_PUBLIC_BACKEND_URL?.trim() || FALLBACK_BASE;
const BASE_URL = rawBaseUrl.replace(/\/$/, '') || FALLBACK_BASE;
const IS_ABSOLUTE_BASE = /^https?:\/\//i.test(BASE_URL);
const ADMIN_TOKEN = clientEnv.NEXT_PUBLIC_ADMIN_API_TOKEN ?? '';

const buildQuery = (searchParams?: Record<string, string | number | boolean | null | undefined>) => {
  if (!searchParams) return '';
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const buildUrl = (path: string, searchParams?: Record<string, string | number | boolean | null | undefined>) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (IS_ABSOLUTE_BASE) {
    const url = new URL(`${BASE_URL}${normalizedPath}`);
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  return `${BASE_URL}${normalizedPath}${buildQuery(searchParams)}`;
};

export type RequestOptions = RequestInit & {
  searchParams?: Record<string, string | number | boolean | null | undefined>;
  admin?: boolean;
  parseData?: boolean;
  responseType?: 'json' | 'text' | 'none';
};

const applyHeaders = (init?: RequestInit, admin?: boolean) => {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (admin && ADMIN_TOKEN) {
    headers.set('x-admin-token', ADMIN_TOKEN);
  }
  return headers;
};

const parseResponse = async <T>(
  response: Response,
  parseData: boolean,
  responseType: RequestOptions['responseType'],
) => {
  if (response.status === 204 || responseType === 'none') {
    return undefined as unknown as T;
  }

  const type = responseType ?? 'json';
  if (type === 'text') {
    const text = await response.text();
    return text as unknown as T;
  }

  const hasJson = typeof response.json === 'function';
  if (!hasJson) {
    return undefined as unknown as T;
  }

  const payload = (await response.json()) as unknown;
  if (!parseData) {
    return payload as T;
  }
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    throw new Error('Malformed response payload (missing data property)');
  }
  return (payload as { data: T }).data;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { searchParams, admin, parseData = false, responseType, ...init } = options;
  const url = buildUrl(path, searchParams);
  const headers = applyHeaders(init, admin);
  const response = await fetch(url, {
    credentials: admin ? init.credentials ?? 'include' : init.credentials,
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return parseResponse<T>(response, parseData, responseType);
}

async function data<T>(path: string, options?: RequestOptions) {
  return request<T>(path, { ...options, parseData: true });
}

export const httpClient = {
  request,
  data,
};
