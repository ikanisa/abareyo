import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";

export default async function MorePage() {
  return (
    <PageShell>
      <SubpageHeader
        title="My Profile"
        eyebrow="More"
        description="Manage your passes, loyalty rewards, services, and preferences."
        backHref="/"
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link className="tile flex h-28 flex-col justify-center gap-2 text-lg font-semibold" href="/more/wallet">
          <span aria-hidden className="text-3xl">
            💼
          </span>
          Wallet &amp; Passes
        </Link>
        <Link className="tile flex h-28 flex-col justify-center gap-2 text-lg font-semibold" href="/more/rewards">
          <span aria-hidden className="text-3xl">
            ⭐
          </span>
          Rewards Hub
        </Link>
        <Link className="tile flex h-28 flex-col justify-center gap-2 text-lg font-semibold" href="/services">
          <span aria-hidden className="text-3xl">
            🏦
          </span>
          Insurance &amp; Savings
        </Link>
        <Link className="tile flex h-28 flex-col justify-center gap-2 text-lg font-semibold" href="/more/settings">
          <span aria-hidden className="text-3xl">
            ⚙️
          </span>
          Settings
        </Link>
        <Link className="tile flex h-28 flex-col justify-center gap-2 text-lg font-semibold" href="/community">
          <span aria-hidden className="text-3xl">
            🤝
          </span>
          Community Missions
        </Link>
        <Link className="tile flex h-28 flex-col justify-center gap-2 text-lg font-semibold" href="/fundraising">
          <span aria-hidden className="text-3xl">
            🎗️
          </span>
          Fundraising Projects
        </Link>
      </section>
    </PageShell>
  );
}
