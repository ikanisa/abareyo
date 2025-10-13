import Image from "next/image";

import { MatchMeta } from "@/app/_data/matchday";

const statusCopy: Record<MatchMeta["status"], string> = {
  live: "Live",
  ht: "Half-time",
  ft: "Full-time",
  upcoming: "Upcoming",
};

type StreamingHeroProps = {
  match: MatchMeta;
};

const StreamingHero = ({ match }: StreamingHeroProps) => {
  return (
    <header className="rounded-3xl bg-gradient-to-br from-cyan-500/60 via-indigo-500/70 to-slate-900/80 p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            aria-live={match.status === "live" ? "polite" : undefined}
          >
            {statusCopy[match.status]}
          </span>
          <span className="text-sm text-white/70">{match.minute}</span>
        </div>
        <div className="flex items-center gap-2 text-right text-xs text-white/70">
          <span>{match.venue}</span>
          <span className="h-4 w-px bg-white/40" aria-hidden="true" />
          <span>{match.kickoff}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/20">
            <Image
              src={match.badge}
              alt={`${match.competition} badge`}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70">
              {match.competition}
            </p>
            <div className="flex items-center gap-2 text-2xl font-black">
              <span>{match.home.score}</span>
              <span className="text-base font-semibold text-white/60">:</span>
              <span>{match.away.score}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end text-sm font-semibold">
          <span>{match.home.name}</span>
          <span className="text-white/60">vs</span>
          <span>{match.away.name}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-medium">
        <button
          type="button"
          className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-left transition hover:bg-white/20"
        >
          Live centre
        </button>
        <button
          type="button"
          className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-left transition hover:bg-white/20"
        >
          Multi-angle
        </button>
      </div>
    </header>
  );
};

export default StreamingHero;
