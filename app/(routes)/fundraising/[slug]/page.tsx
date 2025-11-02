import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { fundraisingCampaigns } from "@/app/_config/home";
import { buildRouteMetadata } from "@/app/_lib/navigation";

type FundraisingPageProps = {
  params: { slug: string };
};

const formatCurrency = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
}).format;

const FundraisingDetailPage = ({ params }: FundraisingPageProps) => {
  const campaign = fundraisingCampaigns.find(
    (entry) => entry.href.replace("/fundraising/", "") === params.slug,
  );

  if (!campaign) {
    notFound();
  }

  const progress = campaign.target
    ? Math.min(100, Math.round((campaign.raised / campaign.target) * 100))
    : 0;

  return (
    <PageShell>
      <SubpageHeader
        title={campaign.title}
        eyebrow="Fundraising Spotlight"
        description={campaign.description}
        backHref="/fundraising"
        actions={
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
            {progress}% funded
          </span>
        }
      />
      <section className="glass rounded-3xl border border-white/10 px-6 py-5 text-white">
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">Raised</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(campaign.raised)}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/60">Target</p>
              <p className="text-2xl font-bold text-white/90">{formatCurrency(campaign.target)}</p>
            </div>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={campaign.target}
            aria-valuenow={campaign.raised}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-white/75">
            Every contribution accelerates our ability to deliver a better matchday. Tap the donate button on the main
            fundraising page to pledge via Mobile Money.
          </p>
        </div>
      </section>
    </PageShell>
  );
};

export default FundraisingDetailPage;

export async function generateMetadata({ params }: FundraisingPageProps): Promise<Metadata> {
  const campaign = fundraisingCampaigns.find(
    (entry) => entry.href.replace("/fundraising/", "") === params.slug,
  );

  if (!campaign) {
    return buildRouteMetadata("/fundraising", {
      title: "Fundraising spotlight",
      description: "Discover the latest Rayon Sports projects and pledge your support.",
    });
  }

  return buildRouteMetadata(campaign.href, {
    title: `${campaign.title} — Fundraising spotlight`,
    description: campaign.description,
  });
}
