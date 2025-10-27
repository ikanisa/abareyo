import { httpClient } from '@/services/http-client';

export type AdminFeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
  updatedBy: { id: string; displayName: string } | null;
};

export const fetchAdminFeatureFlags = async () => {
  return httpClient.data<AdminFeatureFlag[]>('/admin/feature-flags', { admin: true });
};

export const upsertAdminFeatureFlag = async (payload: { key: string; enabled: boolean; description?: string }) => {
  return httpClient.data<AdminFeatureFlag>('/admin/feature-flags', {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
