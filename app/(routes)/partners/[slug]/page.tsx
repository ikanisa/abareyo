import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';

import { tryGetSupabaseServerAnonClient } from '@/lib/db';

import PageShell from '@/app/_components/shell/PageShell';
import { buildRouteMetadata } from '@/app/_lib/navigation';

import PartnerFrame from './_components/PartnerFrame';

export const dynamic = 'force-dynamic';

type PartnerRecord = {
  id: string;
  name: string;
  category: string | null;
  url: string | null;
  logo_url: string | null;
  slug: string | null;
  metadata?: unknown;
};

const fallbackPartner: PartnerRecord = {
  id: 'demo-partner',
  name: 'Visit Rwanda',
  category: 'sponsor',
  url: 'https://www.visitrwanda.com',
  logo_url: null,
  slug: 'visit-rwanda',
};

const getPartner = cache(async (slug: string) => {
  const anon = tryGetSupabaseServerAnonClient();

  if (!anon) {
    if (slug === fallbackPartner.slug || slug === fallbackPartner.id) {
      return { ...fallbackPartner } satisfies PartnerRecord;
    }
    return null;
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

  let partner = bySlug as PartnerRecord | null;

  if (!partner) {
    const { data: byId, error: idError } = await client
      .from('public_partners')
      .select('id,name,category,url,logo_url,slug,metadata')
      .eq('id', slug)
      .maybeSingle();

    if (idError) {
      throw new Error(idError.message);
    }

    partner = (byId as PartnerRecord | null) ?? null;
  }

  if (!partner && (slug === fallbackPartner.slug || slug === fallbackPartner.id)) {
    return { ...fallbackPartner } satisfies PartnerRecord;
  }

  return partner;
});

export default async function PartnerWebview({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  const partner = await getPartner(slug);

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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const partner = await getPartner(params.slug);

  if (!partner) {
    return buildRouteMetadata('/services', {
      title: 'Partner service',
      description: 'Browse partner integrations and exclusive services for Rayon supporters.',
    });
  }

  const slug = partner.slug ?? partner.id;
  return buildRouteMetadata(`/partners/${slug}`, {
    title: `${partner.name} — Partner service`,
    description: partner.category
      ? `Explore the ${partner.category} partnership with Rayon Sports.`
      : 'Explore the partner integration with Rayon Sports.',
  });
}
