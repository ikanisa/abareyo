import PageShell from "@/app/_components/shell/PageShell";
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
      <section className="card">
        <h1>Upcoming Matches</h1>
        <div className="muted">Choose a match, pick a zone, pay via USSD.</div>
      </section>
      <TicketsGrid matches={matches} />
    </PageShell>
  );
}
