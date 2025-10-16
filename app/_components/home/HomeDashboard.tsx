"use client";

import Link from "next/link";
import PageShell from "@/app/_components/shell/PageShell";
import UssdPayButton from "@/app/_components/payments/UssdPayButton";
import Feed from "@/app/_components/home/Feed";
import CommunityStrip from "@/app/_components/home/CommunityStrip";
import RewardsWidget from "@/app/_components/home/RewardsWidget";
import HighlightsRail from "@/app/_components/match/HighlightsRail";
import { I18nProvider, useT } from "@/providers/i18n";

const quickActions = [
  { label: "Tickets", href: "/tickets" },
  { label: "Shop", href: "/shop" },
  { label: "Live Scores", href: "/matches" },
  { label: "Rewards", href: "/more/rewards" },
];

function HomeContent() {
  const { t } = useT();
  const price = 5000;

  return (
    <PageShell>
      <section className="card">
        <h1>Rayon vs APR</h1>
        <div className="muted">Amahoro • Sat 18:00</div>
        <div className="mt-4 space-y-2">
          <UssdPayButton amount={price} />
          <Link className="btn w-full text-center" href="/matches/live">
            Match Centre
          </Link>
        </div>
      </section>

      <section>
        <h2 className="section-title">Quick Actions</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="tile text-center">
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <RewardsWidget />
      <Feed />
      <CommunityStrip />
      <HighlightsRail matchId="latest" />

      <section className="card">
        <h2 className="section-title">Loyalty</h2>
        <p className="muted text-sm">{t("redeem", "Redeem")}&nbsp;your points for matchday perks.</p>
      </section>
    </PageShell>
  );
}

export default function HomeDashboard() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}
