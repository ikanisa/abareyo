import type { OtpBlacklistEntry, OtpDashboardSummary } from '@/types/admin-otp';

import { httpClient } from '@/services/http-client';

export const fetchOtpDashboard = () =>
  httpClient.data<OtpDashboardSummary>('/admin/otp/dashboard', { admin: true });

export const fetchOtpBlacklist = () =>
  httpClient.data<{ phone: OtpBlacklistEntry[]; ip: OtpBlacklistEntry[] }>('/admin/otp/blacklist', {
    admin: true,
  });

export const addOtpBlacklistEntry = (payload: { type: 'phone' | 'ip'; value: string; note?: string }) =>
  httpClient.data<OtpBlacklistEntry>('/admin/otp/blacklist', {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const removeOtpBlacklistEntry = (payload: { type: 'phone' | 'ip'; value: string }) =>
  httpClient.request<void>('/admin/otp/blacklist', {
    admin: true,
    method: 'DELETE',
    body: JSON.stringify(payload),
    responseType: 'none',
  });
