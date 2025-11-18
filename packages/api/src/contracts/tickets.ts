import { z } from "zod";

import { ticketsContracts } from "@rayon/contracts/tickets";

export const ticketSchemas = ticketsContracts.latest.schemas;

export type TicketZoneContract = z.infer<typeof ticketSchemas.ticketZone>;
export type TicketCheckoutItemContract = z.infer<typeof ticketSchemas.checkoutItem>;
export type TicketCheckoutRequestContract = z.infer<typeof ticketSchemas.checkoutRequest>;
export type TicketCheckoutResponseContract = z.infer<typeof ticketSchemas.checkoutResponse>;
export type TicketZoneMetaContract = z.infer<typeof ticketSchemas.catalogResponse>["matches"][number]["zones"][number];
export type TicketCatalogMatchContract = z.infer<typeof ticketSchemas.catalogResponse>["matches"][number];
export type TicketCatalogResponseContract = z.infer<typeof ticketSchemas.catalogResponse>;
export type TicketAnalyticsContract = z.infer<typeof ticketSchemas.analytics>;
export type TicketOrderSummaryContract = z.infer<typeof ticketSchemas.orderSummary>;
export type TicketOrderReceiptContract = z.infer<typeof ticketSchemas.orderReceipt>;
export type ActiveTicketPassContract = z.infer<typeof ticketSchemas.activePass>;
export type RotateTicketPassResponseContract = z.infer<typeof ticketSchemas.rotatePass>;
