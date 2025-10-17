import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import PageShell from '@/app/_components/shell/PageShell';

import PartnerFrame from './_components/PartnerFrame';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const fallbackPartner = {
  id: 'demo-partner',
  name: 'Visit Rwanda',
  category: 'sponsor',
  url: 'https://www.visitrwanda.com',
  logo_url: null,
  slug: 'visit-rwanda',
};

const anon = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default async function PartnerWebview({ params }: { params: { slug: string } }) {
  const slug = params.slug;

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

  const { data: bySlug, error: slugError } = await anon!
    .from('partners')
    .select('id,name,category,url,logo_url,slug')
    .eq('active', true)
    .eq('slug', slug)
    .maybeSingle();

  if (slugError) {
    throw new Error(slugError.message);
  }

  let partner = bySlug;

  if (!partner) {
    const { data: byId, error: idError } = await anon!
      .from('partners')
      .select('id,name,category,url,logo_url,slug')
      .eq('active', true)
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
