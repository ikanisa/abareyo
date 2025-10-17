import A11yNotice from "@/app/(routes)/_components/A11yNotice";
import PersonalizedRail from "@/app/_components/home/PersonalizedRail";
import LiquidHomeScreen from "@/app/_components/home/LiquidScreens";
import LiveScoreWidget from "@/app/(routes)/matches/_components/LiveScoreWidget";

export default function Home() {
  return (
    <>
      <A11yNotice />
      <LiquidHomeScreen />
      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <PersonalizedRail />
        <LiveScoreWidget />
      </div>
    </>
  );
}
