import { buildRouteMetadata } from "@/app/_lib/navigation";

import CommunityClient from "./CommunityClient";

export const metadata = buildRouteMetadata("/community");

const CommunityPage = () => <CommunityClient />;

export default CommunityPage;
