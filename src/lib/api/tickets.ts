import type {
  ActiveTicketPassContract,
  RotateTicketPassResponseContract,
  TicketCheckoutRequestContract,
  TicketCheckoutResponseContract,
  TicketCatalogResponseContract,
  TicketAnalyticsContract,
  TicketOrderReceiptContract,
  TicketOrderSummaryContract,
} from '@rayon/contracts';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ?? '';

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

export interface PassVerificationResponse {
  status: 'verified' | 'used' | 'refunded' | 'not_found';
  passId?: string;
  orderId?: string;
  zone?: string;
}

export async function verifyTicketPass(token: string, options?: { dryRun?: boolean; stewardId?: string }) {
  const params = new URLSearchParams();
  if (options?.dryRun) {
    params.set('dryRun', 'true');
  }

  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/verify-pass${params.toString() ? `?${params.toString()}` : ''}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, stewardId: options?.stewardId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: PassVerificationResponse };
  return data;
}

export interface GateHistoryItem {
  id: string;
  passId: string;
  stewardId?: string | null;
  result: string;
  createdAt: string;
  pass: {
    id: string;
    zone: string;
    orderId: string;
    order: {
      matchId: string;
      userId?: string | null;
    };
  };
}

export async function fetchGateHistory() {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/gate/history`, {
    headers: {
      'x-admin-token': ADMIN_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: GateHistoryItem[] };
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

export async function fetchTicketAnalytics() {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/tickets/analytics`, {
    headers: {
      'x-admin-token': ADMIN_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: TicketAnalyticsContract };
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
