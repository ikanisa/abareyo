import { buildRouteMetadata } from "@/app/_lib/navigation";
import WalletView from "@/views/WalletView";

export const metadata = buildRouteMetadata("/wallet");

const WalletPage = () => <WalletView />;

export default WalletPage;
