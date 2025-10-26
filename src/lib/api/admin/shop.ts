import { httpClient } from '@/services/http-client';

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

export const fetchAdminShopOrders = async (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
} = {}) => {
  return httpClient.request<PaginatedResponse<AdminShopOrder>>('/admin/shop/orders', {
    admin: true,
    searchParams: params,
  });
};

export const updateAdminShopStatus = async (
  orderId: string,
  payload: { status: string; note?: string },
) => {
  return httpClient.data<AdminShopOrder>(`/admin/shop/orders/${orderId}/status`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const addAdminShopFulfillmentNote = async (orderId: string, note: string) => {
  return httpClient.data<AdminShopOrder>(`/admin/shop/orders/${orderId}/note`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const updateAdminShopTracking = async (orderId: string, trackingNumber?: string) => {
  return httpClient.data<AdminShopOrder>(`/admin/shop/orders/${orderId}/tracking`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify({ trackingNumber }),
  });
};

export const fetchAdminShopSummary = async (params: { from?: string; to?: string } = {}) => {
  return httpClient.data<AdminShopSummary>('/admin/shop/summary', {
    admin: true,
    searchParams: params,
  });
};

export const batchUpdateAdminShopStatus = async (payload: { orderIds: string[]; status: string; note?: string }) => {
  return httpClient.data<AdminShopOrder[]>(`/admin/shop/orders/status/batch`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
