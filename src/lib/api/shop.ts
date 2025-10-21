import { clientEnv } from "@/config/env";

const BASE_URL = clientEnv.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: ShopProductImage[];
  thumbnailUrl?: string | null;
  category?: string | null;
}

export interface ShopProductImage {
  key: string;
  url: string | null;
  alt?: string | null;
  contentType?: string | null;
}

export interface ShopCheckoutPayload {
  items: { productId: string; quantity: number }[];
  channel: 'mtn' | 'airtel';
  userId?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface ShopCheckoutResponse {
  orderId: string;
  paymentId?: string;
  total: number;
  ussdCode: string;
  expiresAt: string;
}

async function apiGet<T>(path: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: T };
  return data;
}

export function fetchProducts() {
  return apiGet<ShopProduct[]>(`/shop/products`);
}

export async function checkoutShop(payload: ShopCheckoutPayload): Promise<ShopCheckoutResponse> {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/shop/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: ShopCheckoutResponse };
  return data;
}
