import { buildRouteMetadata } from "@/app/_lib/navigation";
import TicketsView from "@/views/TicketsView";

export const metadata = buildRouteMetadata("/tickets");

const TicketsPage = () => <TicketsView />;

export default TicketsPage;
