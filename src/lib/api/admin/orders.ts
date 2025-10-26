import { httpClient } from '@/services/http-client';

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type AdminTicketOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  expiresAt: string;
  user?: {
    id: string;
    email?: string | null;
    phoneMask?: string | null;
  } | null;
  match?: {
    id: string;
    opponent: string;
    kickoff: string;
    venue: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    metadata?: Record<string, unknown> | null;
  }>;
};

export async function fetchAdminTicketOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  return httpClient.request<PaginatedResponse<AdminTicketOrder>>('/admin/ticket-orders', {
    admin: true,
    searchParams: params,
  });
}

export async function refundTicketOrder(orderId: string) {
  return httpClient.request<{ status?: string; data?: AdminTicketOrder; message?: string }>(
    `/admin/ticket-orders/${orderId}/refund`,
    {
      admin: true,
      method: 'POST',
    },
  );
}

export type AdminShopOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user?: {
    id: string;
    email?: string | null;
  } | null;
  items: Array<{
    id: string;
    qty: number;
    price: number;
    product: { id: string; name: string };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

export async function fetchAdminShopOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  return httpClient.request<PaginatedResponse<AdminShopOrder>>('/admin/shop-orders', {
    admin: true,
    searchParams: params,
  });
}

export type AdminDonation = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  project: { id: string; title: string };
  user?: { id: string; email?: string | null; phoneMask?: string | null } | null;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

export async function fetchAdminDonations(params: { page?: number; pageSize?: number; projectId?: string }) {
  return httpClient.request<PaginatedResponse<AdminDonation>>('/admin/donations', {
    admin: true,
    searchParams: params,
  });
}
