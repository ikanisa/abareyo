"use client";

import type { Club } from "@/app/_data/community";

const FanClubCard = ({ name, city, members }: Club) => (
  <article className="glass flex flex-col gap-3 rounded-2xl border border-white/25 bg-white/10 p-4 text-white" aria-label={name}>
    <div className="flex items-center justify-between">
      <h4 className="text-base font-semibold">{name}</h4>
      <span className="chip bg-white/15 text-xs">{city}</span>
    </div>
    <p className="text-sm text-white/80">
      Connect with {members.toLocaleString()} supporters in {city}. Meet-ups every matchday weekend.
    </p>
    <button
      type="button"
      className="btn min-h-[44px] bg-white/20 px-4 py-3 text-sm font-semibold"
      aria-label={`Join ${name}`}
    >
      Join club
    </button>
  </article>
);

export default FanClubCard;
