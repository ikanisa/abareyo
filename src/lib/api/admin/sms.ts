export type InboundSmsRecord = {
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
};

export type ManualReviewSmsRecord = InboundSmsRecord & {
  parsed?: (InboundSmsRecord['parsed'] & { confidence: number }) | null;
};

export type ManualReviewPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  order?: { id: string; status: string } | null;
  membership?: { id: string; plan?: { name: string } | null } | null;
  donation?: { id: string; project?: { title: string } | null } | null;
  smsParsed?: {
    id: string;
    amount: number;
    currency: string;
    ref: string;
    confidence: number;
  } | null;
};

export type SmsParserPrompt = {
  id: string;
  label: string;
  body: string;
  version: number;
  isActive: boolean;
  createdAt: string;
};

export type SmsParserResult = {
  amount: number;
  currency: string;
  payerMask?: string;
  ref: string;
  timestamp?: string;
  confidence: number;
  parserVersion: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

export const fetchInboundSms = (limit?: number) =>
  request<{ data: InboundSmsRecord[] }>(`/admin/sms/inbound${limit ? `?limit=${limit}` : ''}`).then((res) => res.data);

export const fetchManualReviewSms = (limit?: number) =>
  request<{ data: ManualReviewSmsRecord[] }>(`/admin/sms/manual${limit ? `?limit=${limit}` : ''}`).then((res) => res.data);

export const fetchManualReviewPayments = (limit?: number) =>
  request<{ data: ManualReviewPayment[] }>(`/admin/sms/manual/payments${limit ? `?limit=${limit}` : ''}`).then((res) => res.data);

export const attachSmsToPayment = (payload: { smsId: string; paymentId: string }) =>
  request<{ status: string; data: unknown }>(`/admin/sms/manual/attach`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export type SmsQueueOverview = {
  waiting: number;
  delayed: number;
  active: number;
  pending: Array<{
    jobId: string;
    smsId: string;
    attemptsMade: number;
    maxAttempts: number;
    state: string;
    enqueuedAt: string;
    lastFailedReason?: string | null;
  }>;
};

export const fetchSmsQueueOverview = () =>
  request<{ data: SmsQueueOverview }>(`/admin/sms/queue`).then((res) => res.data);

export const retryManualSms = (smsId: string) =>
  request<{ status: string }>(`/admin/sms/manual/${smsId}/retry`, {
    method: 'POST',
  });

export const dismissManualSms = (
  smsId: string,
  payload: { resolution: 'ignore' | 'linked_elsewhere' | 'duplicate'; note?: string },
) =>
  request<{ status: string }>(`/admin/sms/manual/${smsId}/dismiss`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchSmsParserPrompts = () =>
  request<{ data: SmsParserPrompt[] }>(`/admin/sms/parser/prompts`).then((res) => res.data);

export const fetchActiveSmsParserPrompt = () =>
  request<{ data: SmsParserPrompt | null }>(`/admin/sms/parser/prompts/active`).then((res) => res.data);

export const createSmsParserPrompt = (payload: { label: string; body: string }) =>
  request<{ data: SmsParserPrompt }>(`/admin/sms/parser/prompts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const activateSmsParserPrompt = (promptId: string) =>
  request<{ data: SmsParserPrompt }>(`/admin/sms/parser/prompts/${promptId}/activate`, {
    method: 'POST',
  }).then((res) => res.data);

export const testSmsParser = (payload: { text: string; promptId?: string; promptBody?: string }) =>
  request<{ data: SmsParserResult | null }>(`/admin/sms/parser/test`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data);
