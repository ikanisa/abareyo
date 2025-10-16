import { matches as fallbackMatches } from "@/app/_data/matches";
import PageShell from "@/app/_components/shell/PageShell";
import { buildBackendUrl } from "@/app/(routes)/_lib/backend-url";

import MatchesList from "./_components/MatchesList";
import LiveTicker from "./_components/LiveTicker";

export const dynamic = "force-dynamic";

type MatchesResponse = {
  matches?: unknown;
};

type RemoteMatch = {
  id?: string | number;
  opponent?: string;
  home?: string;
  away?: string;
  venue?: string;
  stadium?: string;
  kickoff?: string;
  date?: string;
  status?: string;
  score?: { home?: number; away?: number } | null;
};

export default async function MatchesPage() {
  let matchesPayload: MatchesResponse | null = null;

  try {
    const response = await fetch(buildBackendUrl("/api/matches"), { cache: "no-store" });
    if (response.ok) {
      matchesPayload = (await response.json()) as MatchesResponse;
    }
  } catch (error) {
    console.warn("Failed to fetch matches feed, falling back to fixtures", error);
  }

  const matchesSource = Array.isArray(matchesPayload?.matches)
    ? (matchesPayload.matches as RemoteMatch[])
    : (fallbackMatches as RemoteMatch[]);

  const normalized = matchesSource.map((match, index) => {
    const kickoff =
      typeof match.kickoff === "string" && match.kickoff
        ? match.kickoff
        : typeof match.date === "string" && match.date
          ? match.date
          : undefined;

    const venue =
      typeof match.venue === "string" && match.venue
        ? match.venue
        : typeof match.stadium === "string" && match.stadium
          ? match.stadium
          : undefined;

    const status =
      (typeof match.status === "string" && match.status) || (match.score ? "live" : "upcoming");

    const opponent =
      match.opponent ||
      (() => {
        const home = typeof match.home === "string" ? match.home : "";
        const away = typeof match.away === "string" ? match.away : "";

        if (home.toLowerCase().includes("rayon")) {
          return away || "Opponent";
        }
        if (away.toLowerCase().includes("rayon")) {
          return home || "Opponent";
        }
        if (home && away) {
          return `${home} vs ${away}`;
        }
        return home || away || "Opponent";
      })();

    return {
      id: match.id?.toString() || `fixture-${index}`,
      opponent,
      kickoff,
      venue,
      status,
    };
  });

  return (
    <PageShell>
      <section className="card space-y-3">
        <h1>Matches</h1>
        <p className="muted">Pick a game. One tap to buy or view live centre.</p>
        <LiveTicker id="latest" />
      </section>

      <MatchesList matches={normalized} />
    </PageShell>
  );
}
