"use client";

import { useState } from "react";
import MatchDetailSheet from "./MatchDetailSheet";

type MatchItem = {
  id: string;
  opponent?: string;
  kickoff?: string;
  venue?: string;
  status?: string;
  home?: string;
  away?: string;
};

type MatchesListProps = {
  matches: MatchItem[];
};

function formatOpponent(match: MatchItem) {
  if (match.opponent) {
    return match.opponent;
  }
  const home = match.home;
  const away = match.away;
  if (!home && !away) return "Fixture";
  const isRayonHome = home?.toLowerCase().includes("rayon");
  const opponentName = isRayonHome ? away : home;
  return opponentName || away || home || "Fixture";
}

function formatKickoff(match: MatchItem) {
  const kickoff = match.kickoff;
  if (!kickoff) return "TBD";
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return kickoff;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchesList({ matches }: MatchesListProps) {
  const [open, setOpen] = useState<string | null>(null);

  if (!matches.length) {
    return (
      <div className="card text-center">
        <div className="text-white/90 font-semibold">No fixtures</div>
        <div className="muted">We’ll refresh this list soon.</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {matches.map((match) => {
          const status = match.status ?? "upcoming";
          const isUpcoming = status === "upcoming";
          const opponent = formatOpponent(match);
          const kickoff = formatKickoff(match);
          const venue = match.venue ?? "—";

          return (
            <div key={match.id} className="card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-white/90 font-semibold">{opponent}</div>
                  <div className="muted text-sm">
                    {kickoff} · {venue}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isUpcoming ? (
                    <a className="btn-primary" href={`/tickets/${match.id}`}>
                      Buy Ticket
                    </a>
                  ) : (
                    <button className="btn" onClick={() => setOpen(match.id)}>
                      Match Centre
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {open ? <MatchDetailSheet id={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
