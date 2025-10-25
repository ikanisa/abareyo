const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type ShopOrderItem = {
  id: string;
  qty: number;
  price: number;
  product: { id: string; name: string; price: number };
};

export type ShopOrderPayment = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type ShopFulfillmentNote = {
  at: string;
  note: string;
  adminUserId: string | null;
};

export type AdminShopOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string | null;
  user?: { id: string; email?: string | null; phoneMask?: string | null } | null;
  items: ShopOrderItem[];
  payments: ShopOrderPayment[];
  fulfillmentNotes?: ShopFulfillmentNote[];
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type AdminShopSummary = {
  totalsByStatus: Record<string, number>;
  totalRevenue: number;
  averageOrderValue: number;
  outstandingCount: number;
  readyForPickupCount: number;
  fulfilledCount: number;
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

export const fetchAdminShopOrders = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
} = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/shop/orders`);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.status) url.searchParams.set('status', params.status);
  if (params.search) url.searchParams.set('search', params.search);
  return request<PaginatedResponse<AdminShopOrder>>(url.pathname + url.search);
};

export const updateAdminShopStatus = async (
  orderId: string,
  payload: { status: string; note?: string },
) => {
  const response = await request<{ status: string; data: AdminShopOrder }>(`/admin/shop/orders/${orderId}/status`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const addAdminShopFulfillmentNote = async (orderId: string, note: string) => {
  const response = await request<{ status: string; data: AdminShopOrder }>(`/admin/shop/orders/${orderId}/note`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return response.data;
};

export const updateAdminShopTracking = async (orderId: string, trackingNumber?: string) => {
  const response = await request<{ status: string; data: AdminShopOrder }>(`/admin/shop/orders/${orderId}/tracking`, {
    method: 'POST',
    body: JSON.stringify({ trackingNumber }),
  });
  return response.data;
};

export const fetchAdminShopSummary = async (params: { from?: string; to?: string } = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/shop/summary`);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);
  return request<{ data: AdminShopSummary }>(url.pathname + url.search).then((res) => res.data);
};

export const batchUpdateAdminShopStatus = async (payload: { orderIds: string[]; status: string; note?: string }) => {
  const response = await request<{ status: string; data: AdminShopOrder[] }>(`/admin/shop/orders/status/batch`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
};
