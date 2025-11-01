import { Suspense } from "react";

import { buildRouteMetadata } from "@/app/_lib/navigation";
import { HeroSection } from "@/app/(routes)/home/_components/HeroSection";
import { LiveTicker } from "@/app/(routes)/home/_components/LiveTicker";
import { PartnerSpotlight } from "@/app/(routes)/home/_components/PartnerSpotlight";
import { PersonalizedFeed } from "@/app/(routes)/home/_components/PersonalizedFeed";
import { QuickActions } from "@/app/(routes)/home/_components/QuickActions";
import type { HomeSurfaceData } from "@/lib/api/home";
import { buildHomeSurfaceData } from "@/lib/home/surface-data";

export const metadata = buildRouteMetadata("/home");

const buildSurface = async (): Promise<HomeSurfaceData> => buildHomeSurfaceData();

export default async function HomeRoute() {
  const surface = await buildSurface();

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 text-white">
      <HeroSection content={surface.hero.content} actions={surface.hero.actions} />
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
        <LiveTicker updates={surface.liveTicker} />
        <QuickActions actions={surface.quickActions} />
      </section>
      <Suspense fallback={<div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-white/70">Loading feed…</div>}>
        <PersonalizedFeed feed={surface.feed} />
      </Suspense>
      <PartnerSpotlight campaigns={surface.fundraising} sponsors={surface.sponsors} />
    </main>
  );
}
