import { buildRouteMetadata } from "@/app/_lib/navigation";
import { shopData } from "@/app/_data/shop_v2";

import ShopExperience from "./ShopExperience";

export const metadata = buildRouteMetadata("/shop");

const ShopPage = () => {
  return <ShopExperience data={shopData} />;
};

export default ShopPage;
