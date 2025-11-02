import { httpClient } from '@/services/http-client';

// Type definitions inlined from contracts
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

export interface SmsRecord {
  id: string;
  text: string;
  fromMsisdn: string;
  toMsisdn?: string | null;
  receivedAt: string;
  ingestStatus: 'received' | 'parsed' | 'error' | 'manual_review';
  parsed?: {
    id: string;
    amount: number;
    currency: string;
    ref: string;
    confidence: number;
    matchedEntity?: string | null;
  } | null;
}

export async function fetchInboundSms() {
  return httpClient.data<SmsRecord[]>('/admin/sms/inbound', { admin: true });
}

export async function fetchManualReviewSms() {
  const data = await httpClient.data<SmsManualReviewItemContract[]>('/admin/sms/manual', {
    admin: true,
  });
  return data.map((sms) => ({
    ...sms,
    parsed: sms.parsed
      ? {
          ...sms.parsed,
          confidence: Number(sms.parsed.confidence ?? 0),
        }
      : null,
  }));
}

export async function fetchManualReviewPayments() {
  const data = await httpClient.data<ManualReviewPaymentContract[]>('/admin/sms/manual/payments', {
    admin: true,
  });
  return data.map((payment) => ({
    ...payment,
    smsParsed: payment.smsParsed
      ? {
          ...payment.smsParsed,
          confidence: Number(payment.smsParsed.confidence ?? 0),
        }
      : payment.smsParsed,
  }));
}

export async function attachSmsToPayment(payload: SmsManualAttachRequestContract) {
  return httpClient.request('/admin/sms/manual/attach', {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
