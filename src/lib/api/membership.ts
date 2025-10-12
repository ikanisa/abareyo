// Type definitions inlined from contracts
export type MembershipPlanContract = {
  id: string;
  name: string;
  price: number;
  perks: Record<string, unknown>;
};

export type MembershipStatusContract = 'pending' | 'active' | 'expired' | 'cancelled';

export type MembershipUpgradeRequestContract = {
  userId: string;
  planId: string;
  channel: 'mtn' | 'airtel';
};

export type MembershipUpgradeResponseContract = {
  membershipId?: string;
  paymentId?: string;
  ussdCode?: string;
  amount?: number;
  expiresAt?: string;
  status?: MembershipStatusContract;
  message?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

async function apiGet<T>(path: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: T };
  return data;
}

export function fetchMembershipPlans() {
  return apiGet<MembershipPlanContract[]>(`/membership/plans`);
}

export function fetchMembershipStatus(userId: string) {
  return apiGet<{
    id: string;
    status: MembershipStatusContract;
    plan: MembershipPlanContract;
    startedAt: string | null;
    expiresAt: string | null;
  } | null>(`/membership/${userId}/status`);
}

export async function upgradeMembership(
  payload: MembershipUpgradeRequestContract,
): Promise<MembershipUpgradeResponseContract> {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/membership/upgrade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: MembershipUpgradeResponseContract };
  return data;
}
