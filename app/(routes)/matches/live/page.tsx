import type { Metadata } from "next";

import { MatchesLiveScreen } from "@/app/_components/home/LiquidScreens";

export const metadata: Metadata = {
  title: "Live Match Centre - Rayon Sports",
  description: "Follow Rayon Sports in real time with a liquid glass live centre.",
};

export default function LiveMatchPage() {
  return <MatchesLiveScreen />;
}
