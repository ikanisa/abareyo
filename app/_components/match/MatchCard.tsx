"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, type KeyboardEvent } from "react";

import type { Match } from "@/app/_data/matches";

const statusCopy: Record<Match["status"], { label: string; tone: string }> = {
  live: { label: "Live", tone: "bg-emerald-500/20 text-emerald-100" },
  upcoming: { label: "Upcoming", tone: "bg-blue-500/20 text-blue-100" },
  ft: { label: "Full time", tone: "bg-white/20 text-white" },
};

const formatKickoff = (iso?: string) => {
  if (!iso) return "TBC";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (_error) {
    return "TBC";
  }
};

type MatchCardProps = {
  match: Match;
  onSelect?: (match: Match) => void;
  isActive?: boolean;
};

const MatchCard = ({ match, onSelect, isActive }: MatchCardProps) => {
  const reduceMotion = useReducedMotion();
  const status = statusCopy[match.status];

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(match);
    }
  }, [match, onSelect]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSelect();
      }
    },
    [handleSelect],
  );

  return (
    <motion.div
      role="listitem"
      tabIndex={0}
      aria-label={`${match.home} vs ${match.away}`}
      aria-expanded={Boolean(isActive)}
      aria-haspopup="dialog"
      aria-roledescription="Match card"
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      whileTap={reduceMotion ? undefined : { scale: 1.04 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`group relative flex min-w-[260px] cursor-pointer select-none flex-col gap-4 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:min-w-[280px] ${isActive ? "ring-2 ring-white/70" : "ring-1 ring-white/10"}`}
    >
      <div className="flex items-center justify-between text-sm text-white/70">
        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/80">
          {match.badge ?? match.comp}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.tone}`}>
          {match.status === "live" ? <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" /> : null}
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-white/70">{match.home}</p>
          <p className="text-lg font-semibold text-white">{match.score ? match.score.home : "-"}</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs uppercase tracking-wide text-white/60">vs</span>
          <span className="text-sm font-semibold text-white/80">{match.liveMinute ?? formatKickoff(match.kickoff)}</span>
        </div>
        <div className="flex-1 space-y-1 text-right">
          <p className="text-sm font-medium text-white/70">{match.away}</p>
          <p className="text-lg font-semibold text-white">{match.score ? match.score.away : "-"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
        <span className="rounded-full bg-white/10 px-3 py-1">{match.venue}</span>
        {match.broadcast ? <span className="rounded-full bg-white/10 px-3 py-1">{match.broadcast}</span> : null}
      </div>

      {match.status === "upcoming" ? (
        <div className="flex gap-3">
          <Link
            href="/tickets"
            className="btn-primary flex-1 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            Buy ticket
          </Link>
          <button
            type="button"
            className="btn flex-1 text-center"
            onClick={(event) => {
              event.stopPropagation();
              handleSelect();
            }}
          >
            Match centre
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>{formatKickoff(match.kickoff)}</span>
          <span>Tap for more stats →</span>
        </div>
      )}
    </motion.div>
  );
};

export default MatchCard;
