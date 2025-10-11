import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'fr', 'rw'] as const;
const LOCALE_RE = new RegExp(`^/(?:${LOCALES.join('|')})(?=/|$)`);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
    return NextResponse.next();
  }

  const hasPrefix = LOCALE_RE.test(pathname);
  const ref = req.headers.get('referer') || '';
  const refMatch = ref.match(/\/(en|fr|rw)(?=\/|$)/);

  // If URL has a locale prefix, rewrite to the bare path for routing
  if (hasPrefix) {
    const bare = pathname.replace(LOCALE_RE, '') || '/';
    return NextResponse.rewrite(new URL(bare, req.url));
  }

  // If no prefix, but referer carried one, keep the user's locale in the URL
  if (refMatch) {
    const locale = refMatch[1];
    const target = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Default (English) without prefix
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};

