export type PartnerServiceCategory =
  | 'savings'
  | 'insurance'
  | 'hospitality'
  | 'transport'
  | 'membership'
  | 'other';

export type PartnerServiceChannel = 'ussd' | 'whatsapp' | 'phone' | 'email' | 'form';

export type PartnerServiceContract = {
  id: string;
  title: string;
  category: PartnerServiceCategory;
  summary: string;
  channel: PartnerServiceChannel;
  ussdCode?: string | null;
  contact?: string | null;
  metadata?: Record<string, unknown>;
};

export type InsuranceQuoteStatus = 'quoted' | 'paid' | 'issued';

export type InsuranceQuoteContract = {
  id: string;
  userId?: string | null;
  motoType?: string | null;
  plate?: string | null;
  periodMonths?: number | null;
  premium: number;
  ticketPerk: boolean;
  status: InsuranceQuoteStatus;
  reference?: string | null;
  createdAt: string;
};

export type PolicyContract = {
  id: string;
  quoteId: string;
  number: string;
  validFrom?: string | null;
  validTo?: string | null;
  freeTicketIssued: boolean;
};

export type SaccoDepositStatus = 'pending' | 'confirmed';

export type SaccoDepositContract = {
  id: string;
  userId?: string | null;
  saccoName: string;
  amount: number;
  status: SaccoDepositStatus;
  reference?: string | null;
  createdAt: string;
};
