const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type AdminReportsOverview = {
  range: { from: string | null; to: string | null };
  shop: {
    totalRevenue: number;
    outstandingCount: number;
    readyForPickupCount: number;
    fulfilledCount: number;
    totalsByStatus: Record<string, number>;
  };
  fundraising: {
    totalRaised: number;
    pendingAmount: number;
    activeProjects: number;
    topProjects: Array<{ id: string; title: string; status: string; goal: number; progress: number; percent: number }>;
    dailySeries: Array<{ date: string; value: number }>;
  };
  membership: {
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    autoRenewEnabled: number;
    expiringSoon: number;
    planSeries: Array<{ planId: string | null; planName: string; members: number }>;
  };
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

export const fetchAdminReportsOverview = async (params: { from?: string; to?: string } = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/reports/overview`);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);
  const payload = await request<{ data: AdminReportsOverview }>(url.pathname + url.search);
  return payload.data;
};
