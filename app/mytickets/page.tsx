import MyTicketsClientPage from "./MyTicketsClientPage";

import { fanProfile } from "@/app/_data/fanProfile";
import type { TicketRecord } from "@/app/_components/tickets/TicketWalletCard";
import { listTicketsForUser, type TicketRecordWithRelations } from "@/app/api/tickets/_queries";

const normalizeMatch = (match: Record<string, unknown> | null | undefined): TicketRecord["match"] => {
  if (!match) return null;
  const id = typeof match.id === "string" ? match.id : String(match.id ?? "");
  const title = typeof match.title === "string" ? match.title : "Match ticket";
  const comp = typeof match.comp === "string" ? match.comp : null;
  const date = typeof match.date === "string" ? match.date : null;
  const venue = typeof match.venue === "string" ? match.venue : null;
  return { id, title, comp, date, venue };
};

const toTicketRecord = (ticket: TicketRecordWithRelations): TicketRecord => ({
  id: ticket.id,
  zone: ticket.zone,
  price: ticket.price,
  paid: Boolean(ticket.paid),
  momo_ref: ticket.momo_ref,
  created_at: ticket.created_at,
  match: normalizeMatch(ticket.match),
});

const loadTickets = async () => {
  try {
    const tickets = await listTicketsForUser({ phone: fanProfile.phone });
    return { tickets: tickets.map(toTicketRecord), error: null as string | null };
  } catch (error) {
    console.error("Failed to load tickets", error);
    return {
      tickets: [] as TicketRecord[],
      error: error instanceof Error ? error.message : "Unable to fetch tickets",
    };
  }
};

const MyTicketsPage = async () => {
  const { tickets, error } = await loadTickets();
  return <MyTicketsClientPage tickets={tickets} error={error} />;
};

export default MyTicketsPage;
