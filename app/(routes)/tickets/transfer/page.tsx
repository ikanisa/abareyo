import TicketTransferView from "@/views/TicketTransferView";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/tickets/transfer", {
  title: "Transfer a ticket",
  description: "Send your Rayon Sports match ticket to a friend in a few taps.",
});

const TicketTransferPage = () => <TicketTransferView />;

export default TicketTransferPage;
