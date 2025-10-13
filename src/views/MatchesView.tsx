"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";

import type { Match } from "@/app/_data/matches";

const formatKickoff = (value?: string) => {
  if (!value) return "TBC";
  const date = new Date(value);
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} • ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const MatchesView = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/matches")
      .then((response) => response.json())
      .then((data: { matches: Match[] }) => {
        if (!mounted) return;
        setMatches(data.matches ?? []);
      })
      .catch(() => setMatches([]))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const live = useMemo(() => matches.filter((match) => match.status === "live"), [matches]);
  const upcoming = useMemo(() => matches.filter((match) => match.status === "upcoming"), [matches]);
  const finished = useMemo(() => matches.filter((match) => match.status === "ft"), [matches]);

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={<Link className="btn" href="/tickets">Tickets</Link>} />
      <header className="card space-y-2 bg-white/10 p-5 text-white">
        <h1 className="text-2xl font-semibold">Match centre</h1>
        <p className="text-sm text-white/70">Follow Rayon Sports fixtures, live scores, and ticket links.</p>
      </header>

      {loading ? (
        <p className="text-sm text-white/70">Loading fixtures…</p>
      ) : (
        <div className="space-y-6">
          {live.length ? (
            <section className="card space-y-3 bg-white/10 p-5 text-white">
              <h2 className="text-xl font-semibold">Live now</h2>
              <ul className="space-y-3">
                {live.map((match) => (
                  <li key={match.id} className="rounded-2xl bg-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {match.home} vs {match.away}
                        </p>
                        <p className="text-xs text-white/70">{match.venue}</p>
                      </div>
                      <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold">LIVE</span>
                    </div>
                    {match.score ? (
                      <p className="mt-2 text-lg font-semibold">
                        {match.score.home} - {match.score.away}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card space-y-3 bg-white/10 p-5 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming fixtures</h2>
              <Link className="btn" href="/tickets">
                Buy tickets
              </Link>
            </div>
            {upcoming.length ? (
              <ul className="space-y-3">
                {upcoming.map((match) => (
                  <li key={match.id} className="rounded-2xl bg-white/10 p-3">
                    <p className="font-semibold">
                      {match.home} vs {match.away}
                    </p>
                    <p className="text-xs text-white/70">{formatKickoff(match.kickoff)} · {match.venue}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/70">No upcoming fixtures announced.</p>
            )}
          </section>

          <section className="card space-y-3 bg-white/10 p-5 text-white">
            <h2 className="text-xl font-semibold">Recent results</h2>
            {finished.length ? (
              <ul className="space-y-3">
                {finished.slice(0, 3).map((match) => (
                  <li key={match.id} className="rounded-2xl bg-white/10 p-3">
                    <p className="font-semibold">
                      {match.home} {match.score?.home ?? 0} – {match.score?.away ?? 0} {match.away}
                    </p>
                    <p className="text-xs text-white/70">{formatKickoff(match.kickoff)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/70">Results will appear after fixtures finish.</p>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
};

export default MatchesView;
