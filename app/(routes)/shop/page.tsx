import { buildRouteMetadata } from "@/app/_lib/navigation";
import ShopView from "@/views/ShopView";

export const metadata = buildRouteMetadata("/shop");

const ShopPage = () => <ShopView />;

export default ShopPage;
