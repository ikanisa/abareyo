import { notFound } from 'next/navigation';

import { tryGetSupabaseServerAnonClient } from '@/lib/db';

import PageShell from '@/app/_components/shell/PageShell';

import PartnerFrame from './_components/PartnerFrame';

export const dynamic = 'force-dynamic';

const fallbackPartner = {
  id: 'demo-partner',
  name: 'Visit Rwanda',
  category: 'sponsor',
  url: 'https://www.visitrwanda.com',
  logo_url: null,
  slug: 'visit-rwanda',
};

export default async function PartnerWebview({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  const anon = tryGetSupabaseServerAnonClient();

  if (!anon) {
    if (slug === fallbackPartner.slug || slug === fallbackPartner.id) {
      return (
        <PageShell>
          <section className="card">
            <h1>Partner experience</h1>
            <p className="muted">Explore exclusive services right inside GIKUNDIRO.</p>
          </section>
          <PartnerFrame partner={{ ...fallbackPartner }} />
        </PageShell>
      );
    }
    notFound();
  }

  const client = anon;

  const { data: bySlug, error: slugError } = await client
    .from('public_partners')
    .select('id,name,category,url,logo_url,slug,metadata')
    .eq('slug', slug)
    .maybeSingle();

  if (slugError) {
    throw new Error(slugError.message);
  }

  let partner = bySlug;

  if (!partner) {
    const { data: byId, error: idError } = await client
      .from('public_partners')
      .select('id,name,category,url,logo_url,slug,metadata')
      .eq('id', slug)
      .maybeSingle();

    if (idError) {
      throw new Error(idError.message);
    }

    partner = byId;
  }

  if (!partner) {
    notFound();
  }

  return (
    <PageShell>
      <section className="card">
        <h1>Partner experience</h1>
        <p className="muted">Explore exclusive services right inside GIKUNDIRO.</p>
      </section>
      <PartnerFrame partner={partner} />
    </PageShell>
  );
}
