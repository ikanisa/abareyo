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

import { httpClient } from '@/services/http-client';

export const fetchInboundSms = (limit?: number) =>
  httpClient.data<InboundSmsRecord[]>(`/admin/sms/inbound`, {
    admin: true,
    searchParams: limit ? { limit } : undefined,
  });

export const fetchManualReviewSms = (limit?: number) =>
  httpClient.data<ManualReviewSmsRecord[]>(`/admin/sms/manual`, {
    admin: true,
    searchParams: limit ? { limit } : undefined,
  });

export const fetchManualReviewPayments = (limit?: number) =>
  httpClient.data<ManualReviewPayment[]>(`/admin/sms/manual/payments`, {
    admin: true,
    searchParams: limit ? { limit } : undefined,
  });

export const attachSmsToPayment = (payload: { smsId: string; paymentId: string }) =>
  httpClient.request<{ status: string; data: unknown }>(`/admin/sms/manual/attach`, {
    admin: true,
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
  httpClient.data<SmsQueueOverview>(`/admin/sms/queue`, { admin: true });

export const retryManualSms = (smsId: string) =>
  httpClient.request<{ status: string }>(`/admin/sms/manual/${smsId}/retry`, {
    admin: true,
    method: 'POST',
  });

export const dismissManualSms = (
  smsId: string,
  payload: { resolution: 'ignore' | 'linked_elsewhere' | 'duplicate'; note?: string },
) =>
  httpClient.request<{ status: string }>(`/admin/sms/manual/${smsId}/dismiss`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchSmsParserPrompts = () =>
  httpClient.data<SmsParserPrompt[]>(`/admin/sms/parser/prompts`, { admin: true });

export const fetchActiveSmsParserPrompt = () =>
  httpClient.data<SmsParserPrompt | null>(`/admin/sms/parser/prompts/active`, { admin: true });

export const createSmsParserPrompt = (payload: { label: string; body: string }) =>
  httpClient.data<SmsParserPrompt>(`/admin/sms/parser/prompts`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const activateSmsParserPrompt = (promptId: string) =>
  httpClient.data<SmsParserPrompt>(`/admin/sms/parser/prompts/${promptId}/activate`, {
    admin: true,
    method: 'POST',
  });

export const testSmsParser = (payload: { text: string; promptId?: string; promptBody?: string }) =>
  httpClient.data<SmsParserResult | null>(`/admin/sms/parser/test`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
