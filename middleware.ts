import { NextRequest, NextResponse } from 'next/server';

import { applySecurityHeaders as withSecurityHeaders } from './config/security-headers.mjs';
import { getAllowedHosts } from '@/lib/server/origins';
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  buildNativeUrl,
  isMobileUserAgent,
  shouldAttemptNativeHandoff,
} from '@/lib/native/links';

const LOCALES = ['en', 'fr', 'rw'] as const;
const LOCALE_RE = new RegExp(`^/(?:${LOCALES.join('|')})(?=/|$)`);
const LOCALE_SET = new Set(LOCALES);
const isProduction = process.env.NODE_ENV === 'production';

const normaliseHost = (host: string | null) => host?.toLowerCase() ?? null;

const getConfiguredHosts = () => getAllowedHosts();

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

    return trustedHosts.has(normaliseHost(refererUrl.host));
  } catch (error) {
    return false;
  }
};

const shouldAttemptNativeHandoffRequest = (req: NextRequest) =>
  shouldAttemptNativeHandoff(req.nextUrl.searchParams);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  // Skip internal next assets and explicit files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
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

