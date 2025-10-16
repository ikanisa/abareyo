import { NextResponse } from 'next/server';

import { findContent } from '@/lib/content';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const item = await findContent(params.slug);

    if (!item) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load content item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
