import type {
  InboundSmsRecord,
  ManualReviewPayment,
  ManualReviewSmsRecord,
  SmsParserPrompt,
  SmsParserResult,
  SmsQueueOverview,
} from '@/types/admin-sms';

import { httpClient } from '@/services/http-client';

export type {
  InboundSmsRecord,
  ManualReviewPayment,
  ManualReviewSmsRecord,
  SmsParserPrompt,
  SmsParserResult,
  SmsQueueOverview,
} from '@/types/admin-sms';

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
