import type {
  ManualReviewPaymentContract,
  SmsManualAttachRequestContract,
  SmsManualReviewItemContract,
} from '@rayon/contracts';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ?? '';

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
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/sms/inbound`, {
    headers: {
      'x-admin-token': ADMIN_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: SmsRecord[] };
  return data;
}

export async function fetchManualReviewSms() {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/sms/manual-review`, {
    headers: {
      'x-admin-token': ADMIN_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: SmsManualReviewItemContract[] };
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
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/payments/manual-review`, {
    headers: {
      'x-admin-token': ADMIN_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: ManualReviewPaymentContract[] };
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
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/sms/manual-review/attach`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
