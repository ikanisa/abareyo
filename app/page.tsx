import { buildRouteMetadata } from "@/app/_lib/navigation";

import HomeClient from "./(routes)/_components/HomeClient";
import HomeHeroSection from "./(routes)/_components/HomeHeroSection";

export const metadata = buildRouteMetadata("/");

const HomePage = () => {
  return <HomeClient hero={<HomeHeroSection />} />;
};

export default HomePage;
