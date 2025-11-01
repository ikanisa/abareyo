import { NextResponse } from 'next/server';

import { tryGetSupabaseServerAnonClient } from '@/lib/db';

const fallbackPartner = {
  id: 'demo-partner',
  name: 'Visit Rwanda',
  category: 'sponsor',
  url: 'https://www.visitrwanda.com',
  logo_url: null,
  slug: 'visit-rwanda',
  active: true,
};

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: 'missing_slug' }, { status: 400 });
  }

  const anon = tryGetSupabaseServerAnonClient();

  if (!anon) {
    if (slug === fallbackPartner.slug || slug === fallbackPartner.id) {
      return NextResponse.json({ partner: fallbackPartner });
    }
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const baseQuery = () =>
    anon
      .from('public_partners')
      .select('id,name,category,url,logo_url,slug,metadata')
      .limit(1);

  const bySlug = await baseQuery().eq('slug', slug).maybeSingle();

  if (bySlug.error) {
    return NextResponse.json({ error: bySlug.error.message }, { status: 500 });
  }

  if (bySlug.data) {
    return NextResponse.json({ partner: bySlug.data });
  }

  const byId = await baseQuery().eq('id', slug).maybeSingle();

  if (byId.error) {
    return NextResponse.json({ error: byId.error.message }, { status: 500 });
  }

  if (!byId.data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ partner: byId.data });
}
