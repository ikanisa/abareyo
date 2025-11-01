"use client";

import type { LiveTickerUpdate } from "@/app/_config/home";

export type LiveTickerProps = {
  updates: LiveTickerUpdate[];
};

export function LiveTicker({ updates }: LiveTickerProps) {
  if (updates.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-3xl border border-white/10 bg-black/40 px-6 py-4 text-white shadow-glow"
      aria-labelledby="home-live-ticker"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-live-ticker" className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
          Live ticker
        </h2>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-rwanda-yellow">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rwanda-yellow" aria-hidden />
          In progress
        </span>
      </div>
      <ol className="mt-4 space-y-3" role="list">
        {updates.map((update) => (
          <li
            key={`${update.minute}-${update.description}`}
            className="flex items-start gap-4 rounded-2xl bg-white/5 px-4 py-3 text-sm"
            aria-label={`${update.minute}' ${update.description}`}
          >
            <span className="font-semibold text-rwanda-yellow">{update.minute}'</span>
            <p className="flex-1 text-white/80">{update.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
