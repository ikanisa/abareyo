const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type AdminFeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
  updatedBy: { id: string; displayName: string } | null;
};

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

export const fetchAdminFeatureFlags = async () => {
  const payload = await request<{ data: AdminFeatureFlag[] }>('/admin/feature-flags');
  return payload.data;
};

export const upsertAdminFeatureFlag = async (payload: { key: string; enabled: boolean; description?: string }) => {
  const response = await request<{ status: string; data: AdminFeatureFlag }>('/admin/feature-flags', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
};
