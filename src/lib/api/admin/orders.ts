const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

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
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/ticket-orders`);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.status) url.searchParams.set('status', params.status);
  if (params.search) url.searchParams.set('search', params.search);

  const response = await fetch(url.toString(), {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load ticket orders');
  }

  return (await response.json()) as PaginatedResponse<AdminTicketOrder>;
}

export async function refundTicketOrder(orderId: string) {
  const response = await fetch(
    `${BASE_URL.replace(/\/$/, '')}/admin/ticket-orders/${orderId}/refund`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  const payload = (await response.json().catch(() => null)) as { status?: string; data?: AdminTicketOrder; message?: string } | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? 'Failed to refund order');
  }

  return payload;
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
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/shop-orders`);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.status) url.searchParams.set('status', params.status);
  if (params.search) url.searchParams.set('search', params.search);

  const response = await fetch(url.toString(), {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load shop orders');
  }

  return (await response.json()) as PaginatedResponse<AdminShopOrder>;
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
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/donations`);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.projectId) url.searchParams.set('projectId', params.projectId);

  const response = await fetch(url.toString(), {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load donations');
  }

  return (await response.json()) as PaginatedResponse<AdminDonation>;
}
