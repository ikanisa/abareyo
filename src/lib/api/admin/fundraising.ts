import { httpClient } from '@/services/http-client';

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

export const fetchAdminFundraisingProjects = async (params: { status?: string; search?: string } = {}) => {
  return httpClient.request<PaginatedResponse<AdminFundraisingProject>>('/admin/fundraising/projects', {
    admin: true,
    searchParams: params,
  });
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
  const response = await httpClient.data<AdminFundraisingProject>('/admin/fundraising/projects', {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response;
};

export const fetchAdminFundraisingDonations = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  search?: string;
} = {}) => {
  return httpClient.request<PaginatedResponse<AdminFundraisingDonation>>('/admin/fundraising/donations', {
    admin: true,
    searchParams: params,
  });
};

export const updateAdminFundraisingDonationStatus = async (
  donationId: string,
  payload: { status: string; note?: string },
) => {
  return httpClient.data<AdminFundraisingDonation>(`/admin/fundraising/donations/${donationId}/status`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const fetchAdminFundraisingSummary = async (params: { from?: string; to?: string } = {}) => {
  return httpClient.data<AdminFundraisingSummary>('/admin/fundraising/summary', {
    admin: true,
    searchParams: params,
  });
};

export const exportAdminFundraisingDonations = async (params: {
  status?: string;
  projectId?: string;
  search?: string;
  from?: string;
  to?: string;
} = {}) => {
  return httpClient.request<string>('/admin/fundraising/donations/export', {
    admin: true,
    responseType: 'text',
    searchParams: params,
  });
};
