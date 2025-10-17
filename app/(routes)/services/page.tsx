import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { ff } from "@/lib/flags";

const ServiceTile = ({
  href,
  label,
  emoji,
}: {
  href: string;
  label: string;
  emoji: string;
}) => (
  <Link
    href={href}
    className="tile flex h-28 flex-col items-center justify-center gap-2 text-center text-base font-semibold transition hover:-translate-y-1 hover:bg-white/20"
  >
    <span className="text-3xl" aria-hidden>
      {emoji}
    </span>
    <span>{label}</span>
  </Link>
);

export default function Services() {
  if (!ff("services.webviews", true)) {
    return (
      <PageShell>
        <SubpageHeader
          title="Services"
          eyebrow="Partner network"
          description="We are curating the best financial partners for Rayon Nation. Check back soon."
          backHref="/"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SubpageHeader
        title="Partner Services"
        eyebrow="Financial hub"
        description="Unlock exclusive insurance, savings, and banking rewards tailored for Rayon fans."
        backHref="/"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceTile href="/services/insurance" label="Motor Insurance" emoji="🚗" />
        <ServiceTile href="/services/savings" label="Savings Streak" emoji="🏦" />
        <ServiceTile href="/more/rewards" label="Season Rewards" emoji="🎁" />
      </div>
    </PageShell>
  );
}
