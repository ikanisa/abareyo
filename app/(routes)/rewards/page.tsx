import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { RewardsDashboard } from "./_components/RewardsDashboard";

export const dynamic = "force-dynamic";

export const metadata = buildRouteMetadata("/rewards", {
  description: "Monitor loyalty points, complete missions, and redeem perks across the GIKUNDIRO ecosystem.",
});

const RewardsPage = () => (
  <PageShell>
    <SubpageHeader
      eyebrow="Loyalty"
      title="Rewards dashboard"
      description="Track progress, complete challenges, and celebrate every perk you unlock as part of Rayon Nation."
      backHref="/more"
      actions={<span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/70">Updated live</span>}
    />
    <RewardsDashboard />
  </PageShell>
);

export default RewardsPage;
