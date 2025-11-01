"use client";

import Link from "next/link";

import type { HomeSurfaceData } from "@/lib/api/home";

export type HeroSectionProps = {
  content: HomeSurfaceData["hero"]["content"];
  actions: HomeSurfaceData["hero"]["actions"];
};

export function HeroSection({ content, actions }: HeroSectionProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-hero p-8 text-white shadow-glow"
      aria-labelledby="home-hero-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.45),_transparent_60%)]" />
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {content.kickoff}
        </div>
        <div className="space-y-4">
          <h1 id="home-hero-title" className="text-4xl font-semibold leading-tight md:text-5xl">
            {content.headline}
          </h1>
          <p className="max-w-2xl text-base text-white/80 md:text-lg">{content.subheadline}</p>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3" role="group" aria-label="Primary actions">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                aria-label={action.ariaLabel}
                className={
                  action.variant === "primary"
                    ? "rounded-full bg-rwanda-yellow px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-glow"
                    : "rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
