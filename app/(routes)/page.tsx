import { buildRouteMetadata } from "@/app/_lib/navigation";

import HomeClient from "./_components/HomeClient";

export const metadata = buildRouteMetadata("/");

const HomePage = () => {
  return <HomeClient />;
};

export default HomePage;
