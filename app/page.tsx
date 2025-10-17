import HomeClient from "@/app/(routes)/_components/HomeClient";
import A11yNotice from "@/app/(routes)/_components/A11yNotice";
import LiveScoreWidget from "@/app/(routes)/matches/_components/LiveScoreWidget";
import PersonalizedRail from "@/app/_components/home/PersonalizedRail";

const HomePage = () => (
  <>
    <A11yNotice />
    <HomeClient />
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PersonalizedRail />
      <LiveScoreWidget />
    </div>
  </>
);

export default HomePage;
