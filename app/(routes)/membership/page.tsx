import { buildRouteMetadata } from "@/app/_lib/navigation";
import MembershipView from "@/views/Membership";

export const metadata = buildRouteMetadata("/membership");

const MembershipPage = () => <MembershipView />;

export default MembershipPage;
