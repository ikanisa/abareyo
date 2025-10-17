import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import TicketsGrid from "./_components/TicketsGrid";

export const dynamic = "force-dynamic";

export default async function Tickets() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/matches`,
    { cache: "no-store" },
  ).catch(() => null);
  const json = await res?.json().catch(() => null);
  const matches = Array.isArray(json?.matches) ? json.matches : [];

  return (
    <PageShell>
      <SubpageHeader
        title="Upcoming Matches"
        eyebrow="Tickets"
        description="Choose a match, pick your zone, and pay seamlessly via mobile money."
        backHref="/"
      />
      <TicketsGrid matches={matches} />
    </PageShell>
  );
}
