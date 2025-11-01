"use client";

import Link from "next/link";

import type { QuickActionTileWithStat } from "@/lib/api/home";

const toneClassMap: Record<"neutral" | "positive" | "warning", string> = {
  neutral: "text-white/70",
  positive: "text-rwanda-yellow",
  warning: "text-rwanda-green",
};

export type QuickActionsProps = {
  actions: QuickActionTileWithStat[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 p-6 text-white shadow-glow">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Quick actions</h2>
        <p className="text-xs text-white/50">Tap to jump into matchday essentials.</p>
      </header>
      <div className="mt-6 grid gap-4 md:grid-cols-2" role="list">
        {actions.map((action) => {
          const tone = action.stat?.tone ?? "neutral";
          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-white/30 hover:bg-white/10"
              role="listitem"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-white/90">
                  <span>{action.label}</span>
                  <span aria-hidden>→</span>
                </div>
                <p className="text-xs text-white/60">{action.description}</p>
              </div>
              {action.stat ? (
                <div className={`text-xs font-semibold ${toneClassMap[tone]}`}>{action.stat.value}</div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
