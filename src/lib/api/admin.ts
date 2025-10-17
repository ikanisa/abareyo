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

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ?? '';

const normalisedBaseUrl = BASE_URL.replace(/\/$/, '');

const buildAdminUrl = (path: string) =>
  `${normalisedBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

const withAdminHeaders = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers);
  if (ADMIN_TOKEN) {
    headers.set('x-admin-token', ADMIN_TOKEN);
  }

  return {
    ...init,
    headers,
  };
};

const adminFetch = async (path: string, init?: RequestInit) => {
  const response = await fetch(buildAdminUrl(path), withAdminHeaders(init));

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response;
};

const extractData = async <T>(response: Response) => {
  const { data } = (await response.json()) as { data: T };
  return data;
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
  const response = await adminFetch('/sms/inbound');
  return extractData<SmsRecord[]>(response);
}

export async function fetchManualReviewSms() {
  const response = await adminFetch('/sms/manual-review');
  const data = await extractData<SmsManualReviewItemContract[]>(response);
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
  const response = await adminFetch('/payments/manual-review');
  const data = await extractData<ManualReviewPaymentContract[]>(response);
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
  const response = await adminFetch('/sms/manual-review/attach', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
