const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type AdminFundraisingProject = {
  id: string;
  title: string;
  description?: string | null;
  goal: number;
  progress: number;
  status: string;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFundraisingDonation = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { id: string; email?: string | null; phoneMask?: string | null } | null;
  project?: { id: string; title: string } | null;
  payments: Array<{ id: string; status: string; amount: number; createdAt: string }>;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type AdminFundraisingSummary = {
  totalRaised: number;
  pendingAmount: number;
  activeProjects: number;
  topProjects: Array<{ id: string; title: string; goal: number; progress: number; status: string; percent: number }>;
  dailySeries: Array<{ date: string; value: number }>;
  range: { from: string | null; to: string | null };
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

export const fetchAdminFundraisingProjects = async (params: { status?: string; search?: string } = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/fundraising/projects`);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.search) url.searchParams.set('search', params.search);
  return request<PaginatedResponse<AdminFundraisingProject>>(url.pathname + url.search);
};

export const upsertAdminFundraisingProject = async (payload: {
  id?: string;
  title: string;
  description?: string;
  goal: number;
  progress: number;
  status?: string;
  coverImage?: string;
}) => {
  const response = await request<{ data: AdminFundraisingProject }>('/admin/fundraising/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const fetchAdminFundraisingDonations = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  search?: string;
} = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/fundraising/donations`);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.status) url.searchParams.set('status', params.status);
  if (params.projectId) url.searchParams.set('projectId', params.projectId);
  if (params.search) url.searchParams.set('search', params.search);
  return request<PaginatedResponse<AdminFundraisingDonation>>(url.pathname + url.search);
};

export const updateAdminFundraisingDonationStatus = async (
  donationId: string,
  payload: { status: string; note?: string },
) => {
  const response = await request<{ status: string; data: AdminFundraisingDonation }>(
    `/admin/fundraising/donations/${donationId}/status`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return response.data;
};

export const fetchAdminFundraisingSummary = async (params: { from?: string; to?: string } = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/fundraising/summary`);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);
  return request<{ data: AdminFundraisingSummary }>(url.pathname + url.search).then((res) => res.data);
};

export const exportAdminFundraisingDonations = async (params: {
  status?: string;
  projectId?: string;
  search?: string;
  from?: string;
  to?: string;
} = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/fundraising/donations/export`);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.projectId) url.searchParams.set('projectId', params.projectId);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);

  const response = await fetch(url.pathname + url.search, {
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.text();
};
