import { NextRequest, NextResponse } from 'next/server';

import { applySecurityHeaders as withSecurityHeaders } from './src/config/security-headers';
import { ADMIN_CSRF_COOKIE, ADMIN_CSRF_ENDPOINT, ADMIN_CSRF_HEADER } from './src/lib/admin/csrf';
import { getAllowedHosts } from './src/lib/server/origins';
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  buildNativeUrl,
  isMobileUserAgent,
  shouldAttemptNativeHandoff,
} from './src/lib/native/links';

const LOCALES = ['en', 'fr', 'rw'] as const;
const LOCALE_RE = new RegExp(`^/(?:${LOCALES.join('|')})(?=/|$)`);
const LOCALE_SET = new Set(LOCALES);
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_API_PREFIX = '/admin/api';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const API_PREFIX = '/api';

type RateLimitRule = {
  matcher: RegExp;
  bucket: string;
  windowMs: number;
  max: number;
};

const RATE_LIMIT_RULES: RateLimitRule[] = [
  { matcher: /^\/api\/auth\//, bucket: 'auth', windowMs: 60_000, max: 10 },
  { matcher: /^\/api\/onboarding\//, bucket: 'onboarding', windowMs: 60_000, max: 12 },
  { matcher: /^\/api\/sms/, bucket: 'sms', windowMs: 60_000, max: 8 },
  { matcher: /^\/api\/payments\//, bucket: 'payments', windowMs: 60_000, max: 15 },
  { matcher: /^\/api\/webhook\//, bucket: 'webhook', windowMs: 60_000, max: 30 },
  { matcher: /^\/api\/community\//, bucket: 'community', windowMs: 60_000, max: 20 },
  { matcher: /^\/api\/telemetry\//, bucket: 'telemetry', windowMs: 60_000, max: 20 },
];

const normaliseHost = (host: string | null) => host?.toLowerCase() ?? null;

const getConfiguredHosts = () => getAllowedHosts();

const matchRateLimitRule = (pathname: string): RateLimitRule | null => {
  for (const rule of RATE_LIMIT_RULES) {
    if (rule.matcher.test(pathname)) {
      return rule;
    }
  }
  return null;
};

const resolveClientIdentifier = (req: NextRequest) => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',').map((segment) => segment.trim()).filter(Boolean);
    if (first) {
      return first;
    }
  }

  const candidates = [req.headers.get('cf-connecting-ip'), req.headers.get('x-real-ip')];
  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return req.ip ?? 'anonymous';
};

const applyCors = (response: NextResponse, req: NextRequest) => {
  const corsHeaders = buildCorsHeaders({
    requestOrigin: req.headers.get('origin'),
    allowCredentials: true,
  });

  if (corsHeaders['Access-Control-Allow-Origin'] === '*') {
    delete corsHeaders['Access-Control-Allow-Credentials'];
  }

  corsHeaders['Access-Control-Max-Age'] = '86400';

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
};

const isTrustedLocaleRedirect = (req: NextRequest, locale: string | null) => {
  if (!locale || !LOCALE_SET.has(locale as (typeof LOCALES)[number])) {
    return false;
  }

  const referer = req.headers.get('referer');
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    const trustedHosts = new Set<string>();
    const requestHost = normaliseHost(req.headers.get('host'));
    if (requestHost) {
      trustedHosts.add(requestHost);
    }
    for (const host of getConfiguredHosts()) {
      trustedHosts.add(host);
    }

    const refererHost = normaliseHost(refererUrl.host);
    return refererHost ? trustedHosts.has(refererHost) : false;
  } catch (error) {
    return false;
  }
};

const shouldAttemptNativeHandoffRequest = (req: NextRequest) =>
  shouldAttemptNativeHandoff(req.nextUrl.searchParams);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method?.toUpperCase() ?? 'GET';

  if (isProduction) {
    const proto = req.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const url = req.nextUrl.clone();
      url.protocol = 'https';
      const host = req.headers.get('host');
      if (host) {
        url.host = host;
      }
      return withSecurityHeaders(NextResponse.redirect(url, 308));
    }
  }

  const isCsrfEndpoint = pathname.startsWith(ADMIN_CSRF_ENDPOINT);

  if (pathname.startsWith(ADMIN_API_PREFIX) && MUTATING_METHODS.has(method) && !isCsrfEndpoint) {
    const headerToken = req.headers.get(ADMIN_CSRF_HEADER);
    const cookieToken = req.cookies.get(ADMIN_CSRF_COOKIE)?.value ?? null;

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      const response = NextResponse.json({ error: 'admin_csrf_invalid' }, { status: 403 });
      return withSecurityHeaders(response);
    }
  }

  if (pathname.startsWith(API_PREFIX)) {
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      applyCors(response, req);
      return withSecurityHeaders(response);
    }

    if (method === 'POST') {
      const rule = matchRateLimitRule(pathname);
      if (rule) {
        const clientId = resolveClientIdentifier(req);
        const result = consumeRateLimit(`${rule.bucket}:${clientId}`, {
          windowMs: rule.windowMs,
          max: rule.max,
        });

        if (!result.success) {
          const retryAfterSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1);
          const response = NextResponse.json(
            {
              error: 'rate_limit_exceeded',
              retryAfter: retryAfterSeconds,
            },
            { status: 429 },
          );
          response.headers.set('Retry-After', retryAfterSeconds.toString());
          applyCors(response, req);
          return withSecurityHeaders(response);
        }
      }
    }

    const response = NextResponse.next();
    applyCors(response, req);
    return withSecurityHeaders(response);
  }

  // Skip internal next assets and explicit files
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.json' ||
    pathname === '/site.webmanifest' ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/icon') ||
    pathname === '/apple-touch-icon.png' ||
    /\.[\w-]+$/.test(pathname)
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  const userAgent = req.headers.get('user-agent');
  if (shouldAttemptNativeHandoffRequest(req) && isMobileUserAgent(userAgent)) {
    const nativeUrl = buildNativeUrl(pathname, req.nextUrl.searchParams);
    if (nativeUrl) {
      const response = NextResponse.redirect(nativeUrl, 307);
      response.headers.set('x-native-fallback-android', PLAY_STORE_URL);
      response.headers.set('x-native-fallback-ios', APP_STORE_URL);
      return withSecurityHeaders(response);
    }
  }

  const hasPrefix = LOCALE_RE.test(pathname);
  const ref = req.headers.get('referer') || '';
  const refMatch = ref.match(/\/(en|fr|rw)(?=\/|$)/);
  const refLocale = refMatch?.[1] ?? null;

  // If URL has a locale prefix, rewrite to the bare path for routing
  if (hasPrefix) {
    const bare = pathname.replace(LOCALE_RE, '') || '/';
    return withSecurityHeaders(NextResponse.rewrite(new URL(bare, req.url)));
  }

  // If no prefix, but referer carried one, keep the user's locale in the URL
  if (refLocale && isTrustedLocaleRedirect(req, refLocale)) {
    const target = pathname === '/' ? `/${refLocale}` : `/${refLocale}${pathname}`;
    return withSecurityHeaders(NextResponse.redirect(new URL(target, req.url)));
  }

  // Default (English) without prefix
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};

