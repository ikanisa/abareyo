import { z } from "zod";

import { defineVersionedContracts, isoDateStringSchema } from "../versioning";

const ticketZoneSchema = z.enum(["VIP", "REGULAR", "GENERAL"]);

const ticketCheckoutItemSchema = z.object({
  zone: ticketZoneSchema,
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

const ticketCheckoutRequestSchema = z.object({
  matchId: z.string().min(1),
  items: z.array(ticketCheckoutItemSchema).min(1),
  channel: z.enum(["mtn", "airtel"]).optional(),
});

const ticketCheckoutResponseSchema = z.object({
  orderId: z.string(),
  total: z.number().nonnegative(),
  ussdCode: z.string(),
  expiresAt: z.string(),
  paymentId: z.string().optional(),
});

const ticketZoneMetaSchema = z.object({
  zone: ticketZoneSchema,
  price: z.number(),
  capacity: z.number().int(),
  remaining: z.number().int(),
  gate: z.string(),
});

const ticketCatalogMatchSchema = z.object({
  id: z.string(),
  opponent: z.string(),
  kickoff: z.string(),
  venue: z.string(),
  competition: z.string().nullable().optional(),
  status: z.string(),
  zones: z.array(ticketZoneMetaSchema),
});

const ticketCatalogResponseSchema = z.object({
  matches: z.array(ticketCatalogMatchSchema),
});

const ticketAnalyticsSchema = z.object({
  totals: z.object({
    revenue: z.number(),
    orders: z.number(),
    paid: z.number(),
    pending: z.number(),
    cancelled: z.number(),
    expired: z.number(),
    averageOrderValue: z.number(),
  }),
  matchBreakdown: z.array(
    z.object({
      matchId: z.string(),
      opponent: z.string(),
      kickoff: z.string(),
      venue: z.string(),
      totalRevenue: z.number(),
      paidOrders: z.number(),
      seatsSold: z.number(),
      capacity: z.number(),
    }),
  ),
  recentSales: z.array(
    z.object({
      date: isoDateStringSchema,
      revenue: z.number(),
      orders: z.number(),
    }),
  ),
  paymentStatus: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
    }),
  ),
});

const ticketOrderMatchSchema = z.object({
  id: z.string(),
  opponent: z.string(),
  kickoff: z.string(),
  venue: z.string(),
});

const ticketOrderItemSchema = z.object({
  id: z.string(),
  zone: z.union([ticketZoneSchema, z.string()]),
  quantity: z.number(),
  price: z.number(),
});

const ticketOrderPaymentSummarySchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.number(),
  createdAt: z.string(),
});

const ticketOrderSummarySchema = z.object({
  id: z.string(),
  status: z.string(),
  total: z.number(),
  createdAt: z.string(),
  expiresAt: z.string(),
  ussdCode: z.string(),
  smsRef: z.string().nullable().optional(),
  match: ticketOrderMatchSchema.nullable(),
  items: z.array(ticketOrderItemSchema),
  payments: z.array(ticketOrderPaymentSummarySchema),
});

const ticketOrderReceiptSchema = ticketOrderSummarySchema.extend({
  payments: z.array(
    ticketOrderPaymentSummarySchema.extend({
      confirmedAt: z.string().nullable(),
      metadata: z.record(z.unknown()).nullable().optional(),
    }),
  ),
  passes: z.array(
    z.object({
      id: z.string(),
      zone: z.union([ticketZoneSchema, z.string()]),
      gate: z.string().nullable().optional(),
      state: z.string(),
      updatedAt: z.string(),
      transferredToUserId: z.string().nullable().optional(),
    }),
  ),
});

const activeTicketPassSchema = z.object({
  passId: z.string(),
  matchId: z.string(),
  matchOpponent: z.string(),
  kickoff: z.string(),
  zone: ticketZoneSchema,
  gate: z.string().nullable().optional(),
  updatedAt: z.string(),
});

const rotateTicketPassResponseSchema = z.object({
  passId: z.string(),
  token: z.string(),
  rotatedAt: z.string(),
  validForSeconds: z.number(),
});

const ticketVersion20241201 = {
  version: "2024-12-01",
  introducedAt: "2024-12-01",
  schemas: {
    ticketZone: ticketZoneSchema,
    checkoutItem: ticketCheckoutItemSchema,
    checkoutRequest: ticketCheckoutRequestSchema,
    checkoutResponse: ticketCheckoutResponseSchema,
    catalogResponse: ticketCatalogResponseSchema,
    analytics: ticketAnalyticsSchema,
    orderSummary: ticketOrderSummarySchema,
    orderReceipt: ticketOrderReceiptSchema,
    activePass: activeTicketPassSchema,
    rotatePass: rotateTicketPassResponseSchema,
  },
  changes: [
    "Initial versioned ticketing contract release covering checkout, catalog, analytics, and pass management flows.",
  ],
} as const;

export const ticketsContracts = defineVersionedContracts({
  domain: "tickets",
  policy: {
    minimumSupportDays: 180,
    notes: "Each ticketing contract version is supported for at least two major release cycles before deprecation.",
  },
  versions: [ticketVersion20241201],
});

export type TicketZoneContract = z.infer<typeof ticketZoneSchema>;
export type TicketCheckoutItemContract = z.infer<typeof ticketCheckoutItemSchema>;
export type TicketCheckoutRequestContract = z.infer<typeof ticketCheckoutRequestSchema>;
export type TicketCheckoutResponseContract = z.infer<typeof ticketCheckoutResponseSchema>;
export type TicketZoneMetaContract = z.infer<typeof ticketZoneMetaSchema>;
export type TicketCatalogMatchContract = z.infer<typeof ticketCatalogMatchSchema>;
export type TicketCatalogResponseContract = z.infer<typeof ticketCatalogResponseSchema>;
export type TicketAnalyticsContract = z.infer<typeof ticketAnalyticsSchema>;
export type TicketOrderMatchContract = z.infer<typeof ticketOrderMatchSchema>;
export type TicketOrderItemContract = z.infer<typeof ticketOrderItemSchema>;
export type TicketOrderPaymentSummaryContract = z.infer<typeof ticketOrderPaymentSummarySchema>;
export type TicketOrderSummaryContract = z.infer<typeof ticketOrderSummarySchema>;
export type TicketOrderReceiptContract = z.infer<typeof ticketOrderReceiptSchema>;
export type ActiveTicketPassContract = z.infer<typeof activeTicketPassSchema>;
export type RotateTicketPassResponseContract = z.infer<typeof rotateTicketPassResponseSchema>;
