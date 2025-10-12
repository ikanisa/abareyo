import { buildRouteMetadata } from "@/app/_lib/navigation";
import CommunityView from "@/views/CommunityView";

export const metadata = buildRouteMetadata("/community");

const CommunityPage = () => <CommunityView />;

export default CommunityPage;
