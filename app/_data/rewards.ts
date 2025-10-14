export type RewardHistory = {
  id: string;
  title: string;
  date: string;
  points: number;
  description?: string;
  type: 'earn' | 'redeem';
};

export type RewardPerk = {
  id: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
};

export const rewardSummary = {
  points: 14850,
  tier: 'Gold',
  nextTier: 'Platinum',
  nextTierThreshold: 20000,
  expiringPoints: 320,
  expiringOn: '2024-12-31',
};

export const perks: RewardPerk[] = [
  {
    id: 'free-blue',
    title: 'Free BLUE Stand Ticket',
    description: 'Redeem 2,500 points to claim a BLUE zone ticket for the next home match.',
    cta: { label: 'Redeem for tickets', href: '/tickets?claimed=1' },
  },
  {
    id: 'shop-discount',
    title: '10% Merch Discount',
    description: 'Spend 1,000 points to unlock a same-day code for the Rayon shop.',
    cta: { label: 'Open shop', href: '/shop' },
  },
  {
    id: 'insurance-perk',
    title: 'Insurance Cashback',
    description: 'Cashback of 5,000 RWF when you renew your insurance via the partner hub.',
    cta: { label: 'Visit services', href: '/services#insurance' },
  },
];

export const history: RewardHistory[] = [
  {
    id: 'earn-1',
    title: 'Match attendance bonus',
    date: '2024-11-03',
    points: 450,
    description: 'Scanned your match ticket vs APR FC.',
    type: 'earn',
  },
  {
    id: 'redeem-1',
    title: 'Redeemed BLUE ticket',
    date: '2024-10-18',
    points: -2500,
    description: 'Claimed free BLUE stand seat for Rayon Sports vs Kiyovu.',
    type: 'redeem',
  },
  {
    id: 'earn-2',
    title: 'SACCO deposit bonus',
    date: '2024-10-05',
    points: 1200,
    description: 'Deposited 80k RWF via SACCO+ with double fan points.',
    type: 'earn',
  },
];
