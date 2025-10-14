"use client";

import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/track";
import type { Match, MatchEvent } from "@/app/_data/matches";

type MatchesClientProps = {
  matches: Match[];
};

const statusLabel: Record<Match["status"], string> = {
  live: "Live",
  upcoming: "Upcoming",
  ft: "Full time",
};

const statusAccent: Record<Match["status"], string> = {
  live: "text-emerald-300",
  upcoming: "text-white/70",
  ft: "text-white/70",
};

const eventIcon: Record<MatchEvent["type"], string> = {
  goal: "⚽",
  "card-yellow": "🟨",
  "card-red": "🟥",
  substitution: "🔄",
  var: "🖥️",
  info: "•",
};

const formatKickoff = (match: Match) => {
  const kickoff = match.kickoff ?? match.date;
  if (!kickoff) return match.date ?? "";
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) {
    return `${match.date ?? ""} • ${match.venue}`.trim();
  }
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} • ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const formatScore = (match: Match) => {
  if (!match.score) return "";
  return `${match.score.home}-${match.score.away}`;
};

const statusHelper = (match: Match) => {
  if (match.status === "live") {
    const minute = match.liveMinute ? `${match.liveMinute}` : "Live";
    return `${minute} • ${formatScore(match)}`;
  }
  if (match.status === "ft") {
    return `Final • ${formatScore(match)}`;
  }
  return "Tap for timeline";
};

const MatchesClient = ({ matches }: MatchesClientProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const grouped = useMemo(() => {
    const live = matches.filter((match) => match.status === "live");
    const upcoming = matches.filter((match) => match.status === "upcoming");
    const finished = matches.filter((match) => match.status === "ft");
    return { live, upcoming, finished };
  }, [matches]);

  const heroMatch = grouped.live[0] ?? grouped.upcoming[0] ?? matches[0];
  const heroSubtitle = heroMatch
    ? `${formatKickoff(heroMatch)} • ${heroMatch.venue}`
    : "Fixtures update weekly";

  const handleSelect = (match: Match) => {
    setSelectedMatch(match);
    track("matches.open_detail", { matchId: match.id, status: match.status });
  };

  return (
    <>
      <section className="card space-y-3">
        <div>
          <h1>Match Centre</h1>
          <p className="muted">
            Live scores, fixtures, and results. Tap a match to view the timeline and line-ups.
          </p>
        </div>
        {heroMatch ? (
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs uppercase tracking-wide text-white/70">Featured</p>
            <p className="text-lg font-semibold text-white">
              {heroMatch.home} vs {heroMatch.away}
            </p>
            <p className="muted text-sm">{heroSubtitle}</p>
          </div>
        ) : null}
      </section>

      <MatchListSection
        title="Live now"
        emptyCopy="No live fixtures. We will refresh the moment play resumes."
        matches={grouped.live}
        onSelect={handleSelect}
      />

      <MatchListSection
        title="Upcoming fixtures"
        emptyCopy="New fixtures will appear here once confirmed."
        matches={grouped.upcoming}
        onSelect={handleSelect}
      />

      <MatchListSection
        title="Recent results"
        emptyCopy="Results will land here right after the final whistle."
        matches={grouped.finished}
        onSelect={handleSelect}
      />

      <MatchDetailSheet match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </>
  );
};

type MatchListSectionProps = {
  title: string;
  emptyCopy: string;
  matches: Match[];
  onSelect: (match: Match) => void;
};

const MatchListSection = ({ title, emptyCopy, matches, onSelect }: MatchListSectionProps) => (
  <section className="space-y-3">
    <h2 className="section-title">{title}</h2>
    {matches.length === 0 ? (
      <div className="card">
        <p className="muted text-sm">{emptyCopy}</p>
      </div>
    ) : (
      <div className="space-y-2">
        {matches.map((match) => (
          <button
            key={match.id}
            type="button"
            className="card w-full space-y-1 text-left transition hover:bg-white/20"
            onClick={() => onSelect(match)}
            aria-label={`View ${match.home} vs ${match.away}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">
                {match.home} <span className="text-white/60">vs</span> {match.away}
              </p>
              <span className={`text-xs font-semibold uppercase tracking-wide ${statusAccent[match.status]}`}>
                {statusLabel[match.status]}
              </span>
            </div>
            <p className="muted text-xs">
              {formatKickoff(match)} • {match.venue}
            </p>
            <p className="text-sm text-white/80">{statusHelper(match)}</p>
          </button>
        ))}
      </div>
    )}
  </section>
);

type MatchDetailSheetProps = {
  match: Match | null;
  onClose: () => void;
};

const useScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, [active]);
};

const MatchDetailSheet = ({ match, onClose }: MatchDetailSheetProps) => {
  useScrollLock(Boolean(match));

  useEffect(() => {
    if (!match) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [match, onClose]);

  if (!match) {
    return null;
  }

  const timeline = match.events ?? [];
  const lineups = match.lineups;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${match.home} vs ${match.away} detail`}
        className="card w-full max-w-md space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              {match.home} vs {match.away}
            </h2>
            <p className="muted text-sm">
              {formatKickoff(match)} • {match.venue}
            </p>
            {match.score ? (
              <p className="text-sm font-semibold text-white">Score {formatScore(match)}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-white">Timeline</h3>
          {timeline.length === 0 ? (
            <p className="muted text-sm">Timeline will appear once the match begins.</p>
          ) : (
            <ul className="space-y-2">
              {timeline.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-3 rounded-2xl bg-white/10 px-3 py-2"
                >
                  <span className="text-xs font-semibold text-white/70">{event.minute}'</span>
                  <div className="space-y-1 text-sm text-white/90">
                    <div className="flex items-center gap-2 text-white">
                      <span aria-hidden="true">{eventIcon[event.type]}</span>
                      <span>{event.description}</span>
                    </div>
                    {event.player ? (
                      <p className="text-xs text-white/70">{event.player}</p>
                    ) : null}
                    {event.scoreline ? (
                      <p className="text-xs text-white/70">Score {event.scoreline}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lineups ? (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Line-ups</h3>
            <div className="grid gap-3">
              {(["home", "away"] as const).map((side) => {
                const lineup = lineups[side];
                if (!lineup) return null;
                const team = side === "home" ? match.home : match.away;
                return (
                  <div key={side} className="rounded-2xl bg-white/10 p-3 text-sm text-white/80">
                    <div className="flex items-center justify-between text-white">
                      <span className="font-semibold">{team}</span>
                      <span className="text-xs text-white/70">{lineup.formation}</span>
                    </div>
                    <p className="text-xs text-white/60">Coach {lineup.coach}</p>
                    <ul className="mt-2 space-y-1">
                      {lineup.starters.map((player) => (
                        <li
                          key={`${side}-${player.number}-${player.name}`}
                          className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-1.5"
                        >
                          <span>
                            {player.number.toString().padStart(2, "0")} {player.name}
                          </span>
                          {player.role ? (
                            <span className="text-xs uppercase text-white/60">{player.role}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MatchesClient;
