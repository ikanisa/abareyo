const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type AdminMembershipPlan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  perks: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminMembershipRecord = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  autoRenew: boolean;
  startedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email?: string | null; phoneMask?: string | null; locale?: string | null } | null;
  plan?: AdminMembershipPlan | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
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

export const fetchAdminMembershipPlans = async () => {
  const payload = await request<{ data: AdminMembershipPlan[] }>(`/admin/membership/plans`);
  return payload.data;
};

export const upsertAdminMembershipPlan = async (payload: {
  id?: string;
  name: string;
  slug: string;
  price: number;
  perks: string[];
  isActive?: boolean;
}) => {
  const response = await request<{ data: AdminMembershipPlan }>(`/admin/membership/plans`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const fetchAdminMembershipMembers = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  planId?: string;
  search?: string;
} = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/membership/members`);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.status) url.searchParams.set('status', params.status);
  if (params.planId) url.searchParams.set('planId', params.planId);
  if (params.search) url.searchParams.set('search', params.search);

  return request<PaginatedResponse<AdminMembershipRecord>>(url.pathname + url.search);
};

export const updateAdminMembershipStatus = async (
  membershipId: string,
  payload: { status: string; autoRenew?: boolean },
) => {
  const response = await request<{ status: string; data: AdminMembershipRecord }>(
    `/admin/membership/members/${membershipId}/status`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return response.data;
};
