import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import RewardsWidget from "@/app/_components/home/RewardsWidget";
import { fixtures } from "@/app/_data/fixtures";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/");

const heroFixture = fixtures.find((fixture) => fixture.status === "upcoming");

const quickActions = [
  { href: "/tickets", label: "🎟️ Tickets" },
  { href: "/shop", label: "🛍️ Shop" },
  { href: "/services", label: "🏦 Services" },
  { href: "/more/rewards", label: "⭐ Rewards" },
] as const;

const whatsNext = [
  {
    title: "Insurance Perk",
    body: "Get a free Blue Ticket when you secure match insurance.",
  },
  {
    title: "Savings Streak",
    body: "Earn rewards faster with weekly SACCO deposits via USSD.",
  },
] as const;

const formatHero = () => {
  if (!heroFixture) {
    return {
      title: "Next match",
      subtitle: "Rayon Sports — stay tuned",
      venue: "",
    };
  }
  return {
    title: `${heroFixture.title} — ${heroFixture.date.split(", ")[0]} ${heroFixture.time}`,
    subtitle: heroFixture.venue,
    venue: heroFixture.venue,
  };
};

const hero = formatHero();

const Home = () => {
  return (
    <PageShell>
      <section className="card space-y-3">
        <div>
          <h1>{hero.title}</h1>
          {hero.subtitle ? <p className="muted">{hero.subtitle}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/tickets" className="btn-primary flex-1 text-center">
            Buy Ticket
          </Link>
          <Link href="/matches" className="btn flex-1 text-center">
            Match Centre
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="tile">
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        {whatsNext.map((item) => (
          <div key={item.title} className="card space-y-1">
            <h2 className="section-title">{item.title}</h2>
            <p className="muted">{item.body}</p>
          </div>
        ))}
      </section>

      <RewardsWidget />
    </PageShell>
  );
};

export default Home;
