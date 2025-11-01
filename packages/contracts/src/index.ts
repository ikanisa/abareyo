export enum PaymentStatusContract {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
  ManualReview = 'manual_review',
}

export enum PaymentKindContract {
  Ticket = 'ticket',
  Membership = 'membership',
  Shop = 'shop',
  Donation = 'donation',
}

export enum TicketZoneContract {
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  GENERAL = 'GENERAL',
}

export type PublicFeatureFlagContract = {
  key: string;
  enabled: boolean;
  description?: string | null;
};

export type PublicPartnerContract = {
  id: string;
  name: string;
  category: string | null;
  url: string | null;
  logoUrl: string | null;
  slug: string;
  metadata?: Record<string, unknown> | null;
};

export type PublicMatchContract = {
  id: string;
  opponent: string | null;
  kickoff: string;
  venue: string | null;
  status: string;
  bluePrice?: number | null;
  regularPrice?: number | null;
  vipPrice?: number | null;
  seatsBlue?: number | null;
  seatsRegular?: number | null;
  seatsVip?: number | null;
};

/**
 * Minimal user information for creating orders, quotes, etc.
 * Used across multiple API endpoints (tickets, shop, insurance, SACCO)
 */
export type UserMiniContract = {
  name?: string;
  phone: string;
  momo_number?: string;
};

export * from './community';
export * from './onboarding';
export * from './commerce';
export * from './services';
export * from './rewards';
export * from './news';
export * from './members';

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

export type TicketAnalyticsContract = {
  totals: {
    revenue: number;
    orders: number;
    paid: number;
    pending: number;
    cancelled: number;
    expired: number;
    averageOrderValue: number;
  };
  matchBreakdown: {
    matchId: string;
    opponent: string;
    kickoff: string;
    venue: string;
    totalRevenue: number;
    paidOrders: number;
    seatsSold: number;
    capacity: number;
  }[];
  recentSales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  paymentStatus: {
    status: string;
    count: number;
  }[];
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

export type SmsIngestPayloadContract = {
  text: string;
  from?: string;
  to?: string;
  receivedAt?: string;
};

export type SmsParsedContract = {
  amount: number;
  currency: string;
  payerMask?: string;
  ref: string;
  timestamp?: string;
  confidence: number;
};

export type SmsManualReviewItemContract = {
  id: string;
  text: string;
  ingestStatus: 'manual_review';
  fromMsisdn?: string | null;
  receivedAt: string;
  parsed?: (SmsParsedContract & { id: string }) | null;
};

export type ManualReviewPaymentContract = {
  id: string;
  amount: number;
  currency: string;
  kind: PaymentKindContract;
  status: PaymentStatusContract;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  smsParsedId?: string | null;
  order?: { id: string; status: string } | null;
  membership?: { id: string; planName?: string | null } | null;
  donation?: { id: string; projectTitle?: string | null } | null;
  smsParsed?: (SmsParsedContract & { id: string }) | null;
};

export type SmsManualAttachRequestContract = {
  smsId: string;
  paymentId: string;
};
