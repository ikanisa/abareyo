'use client';

import useFlags from '@/app/_components/flags/useFlags';

type Partner = {
  id: string;
  name: string;
  category: string;
  url: string;
  logo_url: string | null;
  slug: string | null;
};

export default function PartnerFrame({ partner }: { partner: Partner }) {
  const flags = useFlags();
  const enabled = flags['features.partnerWebviews'];

  if (!enabled) {
    return (
      <div className="card">
        <p className="muted">Partner experiences are gated for this environment.</p>
      </div>
    );
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-center gap-3">
        {partner.logo_url && (
          <img alt={`${partner.name} logo`} className="h-10 w-10 rounded-full" src={partner.logo_url} />
        )}
        <div>
          <h2 className="text-lg font-semibold">{partner.name}</h2>
          <p className="text-xs uppercase tracking-wide text-white/50">{partner.category}</p>
        </div>
      </div>
      <iframe className="h-[70vh] w-full rounded-2xl" src={partner.url} title={partner.name} />
    </section>
  );
}
