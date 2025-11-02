export const ADMIN_CSRF_COOKIE = 'gikundiro-admin-csrf';
export const ADMIN_CSRF_HEADER = 'x-admin-csrf';
export const ADMIN_CSRF_ENDPOINT = '/admin/api/auth/csrf';

const CSRF_COOKIE_NAME = ADMIN_CSRF_COOKIE;
const CSRF_HEADER_NAME = ADMIN_CSRF_HEADER;
const CSRF_ENDPOINT = ADMIN_CSRF_ENDPOINT;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let cachedToken: string | null = null;
let inflight: Promise<string> | null = null;

const readCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  return value ? decodeURIComponent(value.split('=').slice(1).join('=')) : null;
};

const requestCsrfToken = async () => {
  const response = await fetch(CSRF_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to obtain CSRF token');
  }

  const payload = (await response.json().catch(() => ({}))) as { token?: string };
  if (!payload.token) {
    throw new Error('Malformed CSRF token response');
  }

  return payload.token;
};

export async function ensureAdminCsrfToken(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const cookieValue = readCookie(CSRF_COOKIE_NAME);
  if (cookieValue) {
    cachedToken = cookieValue;
    return cookieValue;
  }

  // The CSRF cookie may expire or be cleared by the user. If the cookie is
  // missing we must forget any cached token so that we can request a fresh
  // one from the server. Otherwise we would return a stale token that no
  // longer matches an active cookie, resulting in persistent 403 responses
  // for subsequent mutations.
  cachedToken = null;

  if (!inflight) {
    inflight = requestCsrfToken()
      .then((token) => {
        cachedToken = token;
        inflight = null;
        return token;
      })
      .catch((error) => {
        inflight = null;
        throw error;
      });
  }

  return inflight;
}

const shouldAttachCsrf = (input: RequestInfo | URL, method: string) => {
  if (!MUTATING_METHODS.has(method)) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof input === 'string') {
    return !input.startsWith(CSRF_ENDPOINT);
  }

  if (input instanceof URL) {
    return !input.pathname.startsWith(CSRF_ENDPOINT);
  }

  if (input instanceof Request) {
    return !input.url.includes(CSRF_ENDPOINT);
  }

  return true;
};

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();

  if (!shouldAttachCsrf(input, method)) {
    return fetch(input, init);
  }

  try {
    const token = await ensureAdminCsrfToken();
    const headers = new Headers(init?.headers ?? {});
    if (token) {
      headers.set(CSRF_HEADER_NAME, token);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error('Failed to attach admin CSRF token', error);
    return fetch(input, init);
  }
}

