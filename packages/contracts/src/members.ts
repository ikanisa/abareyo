export type MembershipStatusContract = 'pending' | 'active' | 'expired' | 'cancelled';

export type MembershipPlanContract = {
  id: string;
  name: string;
  price: number;
  perks: Record<string, unknown>;
};

export type MembershipContract = {
  id: string;
  userId: string;
  planId: string;
  status: MembershipStatusContract;
  startedAt?: string | null;
  expiresAt?: string | null;
};

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

export type PublicMemberContract = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
};
