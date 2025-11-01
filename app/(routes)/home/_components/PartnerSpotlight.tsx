"use client";

import type { FundraisingCampaignWithProgress, HomeSurfaceData, Sponsor } from "@/lib/api/home";

export type PartnerSpotlightProps = {
  campaigns: FundraisingCampaignWithProgress[];
  sponsors: Sponsor[];
};

export function PartnerSpotlight({ campaigns, sponsors }: PartnerSpotlightProps) {
  const leadCampaign = campaigns[0];
  const primarySponsors = sponsors.filter((entry) => entry.tier === "platinum");

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
      {leadCampaign ? (
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-glow" aria-label="Fundraising progress">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Fundraising</p>
            <h2 className="text-xl font-semibold">{leadCampaign.title}</h2>
            <p className="text-sm text-white/70">{leadCampaign.description}</p>
          </header>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{leadCampaign.progress}% funded</span>
              <span>Target {leadCampaign.target.toLocaleString()} RWF</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-rwanda-yellow"
                style={{ width: `${Math.min(100, leadCampaign.progress)}%` }}
                aria-hidden
              />
            </div>
          </div>
        </article>
      ) : null}
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-glow" aria-label="Club partners">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Partners</p>
          <h2 className="text-lg font-semibold">Platinum sponsors</h2>
        </header>
        <ul className="mt-4 space-y-3 text-sm">
          {primarySponsors.length > 0
            ? primarySponsors.map((sponsor) => (
                <li key={sponsor.id} className="rounded-2xl bg-black/40 px-4 py-3 text-white/80">
                  {sponsor.name}
                </li>
              ))
            : (
                <li className="rounded-2xl bg-black/40 px-4 py-3 text-white/60">Partner roster coming soon</li>
              )}
        </ul>
      </aside>
    </section>
  );
}
