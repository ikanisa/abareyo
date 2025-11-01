"use client";

import dynamic from "next/dynamic";

import Feed from "@/app/_components/home/Feed";
import PersonalizedRail from "@/app/_components/home/PersonalizedRail";

import type { HomeSurfaceData } from "@/lib/api/home";

const RewardsWidget = dynamic(() => import("@/app/_components/home/RewardsWidget"), { ssr: false });

export type PersonalizedFeedProps = {
  feed: HomeSurfaceData["feed"];
};

export function PersonalizedFeed({ feed }: PersonalizedFeedProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-white shadow-glow">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Personalized feed</h2>
            <span className="text-xs text-white/50">Club news, missions & fixtures</span>
          </header>
          <Feed items={feed} />
        </div>
      </div>
      <div className="space-y-6">
        <RewardsWidget />
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-white shadow-glow">
          <PersonalizedRail />
        </div>
      </div>
    </section>
  );
}
