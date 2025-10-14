export type AdminShopProduct = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  description: string | null;
  badge: string | null;
  image_url: string | null;
  images: string[];
};

export type AdminShopOrderItem = {
  id: string;
  qty: number;
  price: number;
  product: { id: string; name: string; image_url: string | null };
};

export type AdminShopOrder = {
  id: string;
  status: string;
  total: number;
  momo_ref: string | null;
  created_at: string;
  user?: { id: string; name: string | null; phone: string | null } | null;
  items: AdminShopOrderItem[];
  payments: Array<{ id: string; amount: number; status: string; created_at: string }>;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function listAdminShopProducts(params: { category?: string; q?: string } = {}) {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  const query = search.toString();
  const response = await fetch(`/admin/api/shop/products${query ? `?${query}` : ''}`, { cache: 'no-store' });
  const payload = await parseResponse<{ products: AdminShopProduct[] }>(response);
  return payload.products;
}

export async function createAdminShopProduct(payload: Partial<AdminShopProduct>) {
  const response = await fetch('/admin/api/shop/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseResponse<{ product: AdminShopProduct }>(response);
  return result.product;
}

export async function updateAdminShopProduct(payload: Partial<AdminShopProduct> & { id: string }) {
  const response = await fetch('/admin/api/shop/products', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseResponse<{ product: AdminShopProduct }>(response);
  return result.product;
}

export async function deleteAdminShopProduct(id: string) {
  const response = await fetch(`/admin/api/shop/products?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await parseResponse<{ ok: boolean }>(response);
}

export async function uploadAdminMedia(payload: { fileName: string; dataUrl: string }) {
  const response = await fetch('/admin/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseResponse<{ url: string }>(response);
  return result.url;
}

export async function listAdminShopOrders(params: { status?: string; q?: string } = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.q) search.set('q', params.q);
  const query = search.toString();
  const response = await fetch(`/admin/api/shop/orders${query ? `?${query}` : ''}`, { cache: 'no-store' });
  const payload = await parseResponse<{ orders: AdminShopOrder[] }>(response);
  return payload.orders;
}

export async function updateAdminShopOrder(payload: { id: string; status?: string; momo_ref?: string | null }) {
  const response = await fetch('/admin/api/shop/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseResponse<{ order: AdminShopOrder }>(response);
  return result.order;
}
