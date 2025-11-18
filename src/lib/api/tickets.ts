import { z } from 'zod';

import {
  ActiveTicketPassContract,
  RotateTicketPassResponseContract,
  TicketAnalyticsContract,
  TicketCatalogMatchContract,
  TicketCatalogResponseContract,
  TicketCheckoutRequestContract,
  TicketCheckoutResponseContract,
  TicketOrderReceiptContract,
  TicketOrderSummaryContract,
  ticketSchemas,
} from '@rayon/api/contracts/tickets';
import { adminFetch } from '@/lib/admin/csrf';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';

const passVerificationSchema = z.object({
  status: z.enum(['verified', 'used', 'refunded', 'not_found']),
  passId: z.string().optional(),
  orderId: z.string().optional(),
  zone: z.string().optional(),
});

const gateHistoryItemSchema = z.object({
  id: z.string(),
  passId: z.string(),
  stewardId: z.string().nullable().optional(),
  result: z.string(),
  createdAt: z.string(),
  pass: z.object({
    id: z.string(),
    zone: z.string(),
    orderId: z.string(),
    order: z.object({
      matchId: z.string(),
      userId: z.string().nullable().optional(),
    }),
  }),
});

const initiateTransferPayloadSchema = z.object({
  passId: z.string(),
  ownerUserId: z.string(),
  targetUserId: z.string().optional(),
  targetPhone: z.string().optional(),
});

const initiateTransferResponseSchema = z.object({
  transferCode: z.string(),
  passId: z.string(),
  targetUserId: z.string().nullable(),
});

const claimTransferPayloadSchema = z.object({
  passId: z.string(),
  recipientUserId: z.string(),
  transferCode: z.string(),
});

const matchSummarySchema = z.object({
  id: z.string(),
  opponent: z.string(),
  kickoff: z.string(),
  venue: z.string(),
  status: z.string(),
  competition: z.string().nullable().optional(),
  score: z
    .object({
      home: z.number(),
      away: z.number(),
    })
    .nullable()
    .optional(),
  timeline: z
    .array(
      z.object({
        minute: z.number(),
        type: z.string(),
        description: z.string(),
        team: z.enum(['home', 'away']),
      }),
    )
    .optional(),
  stats: z
    .array(
      z.object({
        label: z.string(),
        home: z.number(),
        away: z.number(),
      }),
    )
    .optional(),
});

const apiData = async <T>(response: Response, schema: z.ZodType<T>) => {
  const payload = (await response.json()) as { data: unknown };
  return schema.parse(payload.data ?? payload);
};

export async function createTicketCheckout(
  payload: TicketCheckoutRequestContract,
): Promise<TicketCheckoutResponseContract> {
  const validatedPayload = ticketSchemas.checkoutRequest.parse(payload);
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/checkout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(validatedPayload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create ticket order');
  }

  return apiData(response, ticketSchemas.checkoutResponse);
}

export type PassVerificationResponse = z.infer<typeof passVerificationSchema>;

export async function verifyTicketPass(token: string, options?: { dryRun?: boolean; stewardId?: string }) {
  const params = new URLSearchParams();
  if (options?.dryRun) {
    params.set('dryRun', 'true');
  }

  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/verify-pass${
    params.toString() ? `?${params.toString()}` : ''
  }`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, stewardId: options?.stewardId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return apiData(response, passVerificationSchema);
}

export type GateHistoryItem = z.infer<typeof gateHistoryItemSchema>;

export async function fetchGateHistory() {
  const response = await adminFetch('/admin/api/tickets/gate-history', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return apiData(response, z.array(gateHistoryItemSchema));
}

export type InitiateTransferPayload = z.infer<typeof initiateTransferPayloadSchema>;
export type InitiateTransferResponse = z.infer<typeof initiateTransferResponseSchema>;

export async function initiateTicketTransfer(payload: InitiateTransferPayload) {
  const body = initiateTransferPayloadSchema.parse(payload);
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes/initiate-transfer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return apiData(response, initiateTransferResponseSchema);
}

export type ClaimTransferPayload = z.infer<typeof claimTransferPayloadSchema>;

export async function claimTicketTransfer(payload: ClaimTransferPayload) {
  const body = claimTransferPayloadSchema.parse(payload);
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes/claim-transfer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return apiData(response, z.object({ passId: z.string(), recipientUserId: z.string() }));
}

export async function fetchTicketCatalog(): Promise<TicketCatalogMatchContract[]> {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/catalog`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const catalog = await apiData(response, ticketSchemas.catalogResponse);
  return (catalog as TicketCatalogResponseContract).matches;
}

export type TicketMatchSummary = z.infer<typeof matchSummarySchema>;

export async function fetchMatchSummaries() {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/matches/summaries`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return apiData(response, z.array(matchSummarySchema));
}

export async function fetchTicketAnalytics(): Promise<TicketAnalyticsContract> {
  const response = await adminFetch('/admin/api/tickets/analytics', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return apiData(response, ticketSchemas.analytics);
}

export async function fetchActivePasses(userId: string): Promise<ActiveTicketPassContract[]> {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return apiData(response, z.array(ticketSchemas.activePass));
}

export async function rotateTicketPass(passId: string, userId: string): Promise<RotateTicketPassResponseContract> {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes/rotate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ passId, userId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return apiData(response, ticketSchemas.rotatePass);
}

export async function fetchTicketOrders(userId: string): Promise<TicketOrderSummaryContract[]> {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/orders?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return apiData(response, z.array(ticketSchemas.orderSummary));
}

export async function cancelTicketOrder(orderId: string, userId: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return apiData(response, z.object({ id: z.string(), status: z.string() }));
}

export async function fetchTicketReceipt(
  orderId: string,
  userId: string,
): Promise<TicketOrderReceiptContract> {
  const params = new URLSearchParams({ userId });
  const response = await fetch(
    `${BASE_URL.replace(/\/$/, '')}/tickets/orders/${orderId}/receipt?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return apiData(response, ticketSchemas.orderReceipt);
}
