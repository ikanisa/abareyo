import PageShell from "@/app/_components/shell/PageShell";
import MatchesList from "./_components/MatchesList";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/matches`;
  const res = await fetch(endpoint, { cache: "no-store" }).catch(() => null);
  const data = await res?.json().catch(() => null);
  const matches = Array.isArray(data?.matches) ? data.matches : [];

  return (
    <PageShell>
      <section className="card">
        <h1>Matches</h1>
        <p className="muted">Pick a game. One tap to buy or view live centre.</p>
      </section>
      <MatchesList matches={matches} />
    </PageShell>
  );
}
