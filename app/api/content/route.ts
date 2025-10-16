import { NextResponse } from 'next/server';

import { listContent } from '@/lib/content';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('q');
  const kind = url.searchParams.get('kind');
  const tag = url.searchParams.get('tag');

  try {
    const items = await listContent({ kind, tag, search });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
