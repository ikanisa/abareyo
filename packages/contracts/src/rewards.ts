export type RewardSourceContract = 'transaction' | 'policy_perk' | 'manual_adjustment';

export type RewardEventContract = {
  id: string;
  userId?: string | null;
  source: RewardSourceContract;
  referenceId?: string | null;
  points: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type PerkIssuanceRequestContract = {
  quoteId: string;
  minimumPremium: number;
  reason: string;
};

export type PerkIssuanceResponseContract = {
  ok: boolean;
  ticketId?: string | null;
  reason?: string;
};
