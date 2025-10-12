import { buildRouteMetadata } from "@/app/_lib/navigation";
import MoreView from "@/views/MoreView";

export const metadata = buildRouteMetadata("/more");

const MorePage = () => <MoreView />;

export default MorePage;
