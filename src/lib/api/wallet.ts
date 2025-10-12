// Type definitions inlined from contracts
export enum PaymentStatusContract {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
  ManualReview = 'manual_review',
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export interface WalletSummary {
  pending: number;
  confirmed: number;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatusContract;
  kind: 'ticket' | 'membership' | 'shop' | 'donation';
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  orderId?: string | null;
  membershipId?: string | null;
  donationId?: string | null;
}

async function apiGet<T>(path: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: T };
  return data;
}

export function fetchWalletSummary(userId: string) {
  const search = new URLSearchParams({ userId }).toString();
  return apiGet<WalletSummary>(`/wallet/summary?${search}`);
}

export function fetchWalletTransactions(userId: string) {
  const search = new URLSearchParams({ userId }).toString();
  return apiGet<WalletTransaction[]>(`/wallet/transactions?${search}`);
}
