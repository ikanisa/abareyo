import { NextRequest, NextResponse } from 'next/server';

import { applySecurityHeaders as withSecurityHeaders } from './config/security-headers.mjs';

const LOCALES = ['en', 'fr', 'rw'] as const;
const LOCALE_RE = new RegExp(`^/(?:${LOCALES.join('|')})(?=/|$)`);
const isProduction = process.env.NODE_ENV === 'production';

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
    pathname.startsWith('/icon') ||
    pathname === '/apple-touch-icon.png' ||
    /\.[\w-]+$/.test(pathname)
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  const hasPrefix = LOCALE_RE.test(pathname);
  const ref = req.headers.get('referer') || '';
  const refMatch = ref.match(/\/(en|fr|rw)(?=\/|$)/);

  // If URL has a locale prefix, rewrite to the bare path for routing
  if (hasPrefix) {
    const bare = pathname.replace(LOCALE_RE, '') || '/';
    return withSecurityHeaders(NextResponse.rewrite(new URL(bare, req.url)));
  }

  // If no prefix, but referer carried one, keep the user's locale in the URL
  if (refMatch) {
    const locale = refMatch[1];
    const target = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return withSecurityHeaders(NextResponse.redirect(new URL(target, req.url)));
  }

  // Default (English) without prefix
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};

