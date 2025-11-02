import { NextResponse } from 'next/server';

import { buildNativeUrl } from '@/lib/native/links';

export function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get('target');
  if (!target) {
    return NextResponse.redirect(new URL('/', url));
  }

  if (target.startsWith('gikundiro://')) {
    return NextResponse.redirect(target);
  }

  if (target.startsWith('web+gikundiro://')) {
    const nativePath = target.replace('web+gikundiro://', '');
    const nativeUrl = `gikundiro://${nativePath.replace(/^\/+/, '')}`;
    return NextResponse.redirect(nativeUrl);
  }

  try {
    const incoming = new URL(target);
    if (incoming.protocol === 'gikundiro:') {
      return NextResponse.redirect(target);
    }
    if (incoming.origin === url.origin) {
      return NextResponse.redirect(incoming);
    }
    return NextResponse.redirect(new URL('/', url));
  } catch (_error) {
    const params = new URLSearchParams(url.searchParams);
    params.delete('target');
    const native = buildNativeUrl(target.startsWith('/') ? target : `/${target}`, params);
    return NextResponse.redirect(native);
  }

  return NextResponse.redirect(new URL('/', url));
}
