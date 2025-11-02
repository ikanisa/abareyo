import { MatchesLiveScreen } from "@/app/_components/home/LiquidScreens";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/matches/live", {
  title: "Live match centre",
  description: "Follow Rayon Sports fixtures in real time with a responsive match hub.",
});

export default function LiveMatchPage() {
  return <MatchesLiveScreen />;
}
