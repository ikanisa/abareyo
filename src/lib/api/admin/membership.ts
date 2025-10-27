import { httpClient } from '@/services/http-client';

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

export const fetchAdminMembershipPlans = async () => {
  return httpClient.data<AdminMembershipPlan[]>(`/admin/membership/plans`, { admin: true });
};

export const upsertAdminMembershipPlan = async (payload: {
  id?: string;
  name: string;
  slug: string;
  price: number;
  perks: string[];
  isActive?: boolean;
}) =>
  httpClient.data<AdminMembershipPlan>(`/admin/membership/plans`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchAdminMembershipMembers = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  planId?: string;
  search?: string;
} = {}) => {
  return httpClient.request<PaginatedResponse<AdminMembershipRecord>>('/admin/membership/members', {
    admin: true,
    searchParams: params,
  });
};

export const updateAdminMembershipStatus = async (
  membershipId: string,
  payload: { status: string; autoRenew?: boolean },
) => {
  return httpClient.data<AdminMembershipRecord>(`/admin/membership/members/${membershipId}/status`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
