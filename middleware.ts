import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'fr', 'rw'] as const;
const LOCALE_RE = new RegExp(`^/(?:${LOCALES.join('|')})(?=/|$)`);
const isProduction = process.env.NODE_ENV === 'production';

const applySecurityHeaders = (response: NextResponse) => {
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};

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
      return applySecurityHeaders(NextResponse.redirect(url, 308));
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
    return applySecurityHeaders(NextResponse.next());
  }

  const hasPrefix = LOCALE_RE.test(pathname);
  const ref = req.headers.get('referer') || '';
  const refMatch = ref.match(/\/(en|fr|rw)(?=\/|$)/);

  // If URL has a locale prefix, rewrite to the bare path for routing
  if (hasPrefix) {
    const bare = pathname.replace(LOCALE_RE, '') || '/';
    return applySecurityHeaders(NextResponse.rewrite(new URL(bare, req.url)));
  }

  // If no prefix, but referer carried one, keep the user's locale in the URL
  if (refMatch) {
    const locale = refMatch[1];
    const target = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return applySecurityHeaders(NextResponse.redirect(new URL(target, req.url)));
  }

  // Default (English) without prefix
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};

