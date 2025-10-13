import { buildRouteMetadata } from "@/app/_lib/navigation";
import MatchesView from "@/views/MatchesView";

export const metadata = buildRouteMetadata("/matches");

const MatchesPage = () => <MatchesView />;

export default MatchesPage;
