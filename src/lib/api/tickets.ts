// Type definitions inlined from contracts
export enum TicketZoneContract {
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  GENERAL = 'GENERAL',
}

export type TicketCheckoutItemContract = {
  zone: TicketZoneContract;
  quantity: number;
  price: number;
};

export type TicketCheckoutRequestContract = {
  matchId: string;
  items: TicketCheckoutItemContract[];
  channel?: 'mtn' | 'airtel';
};

export type TicketCheckoutResponseContract = {
  orderId: string;
  total: number;
  ussdCode: string;
  expiresAt: string;
  paymentId?: string;
};

export type TicketZoneMetaContract = {
  zone: TicketZoneContract;
  price: number;
  capacity: number;
  remaining: number;
  gate: string;
};

export type TicketCatalogMatchContract = {
  id: string;
  opponent: string;
  kickoff: string;
  venue: string;
  competition?: string | null;
  status: string;
  zones: TicketZoneMetaContract[];
};

export type TicketCatalogResponseContract = {
  matches: TicketCatalogMatchContract[];
};

export type TicketOrderMatchContract = {
  id: string;
  opponent: string;
  kickoff: string;
  venue: string;
};

export type TicketOrderItemContract = {
  id: string;
  zone: TicketZoneContract | string;
  quantity: number;
  price: number;
};

export type TicketOrderPaymentSummaryContract = {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
};

export type TicketOrderSummaryContract = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  expiresAt: string;
  ussdCode: string;
  smsRef?: string | null;
  match: TicketOrderMatchContract | null;
  items: TicketOrderItemContract[];
  payments: TicketOrderPaymentSummaryContract[];
};

export type TicketOrderReceiptContract = TicketOrderSummaryContract & {
  payments: (TicketOrderPaymentSummaryContract & {
    confirmedAt: string | null;
    metadata: Record<string, unknown> | null;
  })[];
  passes: {
    id: string;
    zone: TicketZoneContract | string;
    gate?: string | null;
    state: string;
    updatedAt: string;
    transferredToUserId?: string | null;
  }[];
};

export type ActiveTicketPassContract = {
  passId: string;
  matchId: string;
  matchOpponent: string;
  kickoff: string;
  zone: TicketZoneContract;
  gate?: string | null;
  updatedAt: string;
};

export type RotateTicketPassResponseContract = {
  passId: string;
  token: string;
  rotatedAt: string;
  validForSeconds: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';

export async function createTicketCheckout(
  payload: TicketCheckoutRequestContract,
): Promise<TicketCheckoutResponseContract> {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/checkout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create ticket order');
  }

  const { data } = (await response.json()) as { data: TicketCheckoutResponseContract };
  return data;
}

export interface InitiateTransferPayload {
  passId: string;
  ownerUserId: string;
  targetUserId?: string;
  targetPhone?: string;
}

export interface InitiateTransferResponse {
  transferCode: string;
  passId: string;
  targetUserId: string | null;
}

export async function initiateTicketTransfer(payload: InitiateTransferPayload) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes/initiate-transfer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: InitiateTransferResponse };
  return data;
}

export interface ClaimTransferPayload {
  passId: string;
  recipientUserId: string;
  transferCode: string;
}

export async function claimTicketTransfer(payload: ClaimTransferPayload) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes/claim-transfer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as { data: { passId: string; recipientUserId: string } };
}

export async function fetchTicketCatalog() {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/catalog`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: TicketCatalogResponseContract['matches'] };
  return data;
}

export type TicketMatchSummary = {
  id: string;
  opponent: string;
  kickoff: string;
  venue: string;
  status: string;
  competition?: string | null;
  score?: {
    home: number;
    away: number;
  } | null;
  timeline?: Array<{
    minute: number;
    type: string;
    description: string;
    team: 'home' | 'away';
  }>;
  stats?: Array<{
    label: string;
    home: number;
    away: number;
  }>;
};

export async function fetchMatchSummaries() {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/matches/summaries`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: TicketMatchSummary[] };
  return data;
}

export async function fetchActivePasses(userId: string) {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: ActiveTicketPassContract[] };
  return data;
}

export async function rotateTicketPass(passId: string, userId: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/passes/rotate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ passId, userId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: RotateTicketPassResponseContract };
  return data;
}

export async function fetchTicketOrders(userId: string) {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/orders?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: TicketOrderSummaryContract[] };
  return data;
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
  const { data } = (await response.json()) as { data: { id: string; status: string } };
  return data;
}

export async function fetchTicketReceipt(orderId: string, userId: string) {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/orders/${orderId}/receipt?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: TicketOrderReceiptContract };
  return data;
}
