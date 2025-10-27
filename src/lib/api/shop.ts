import { httpClient } from '@/services/http-client';

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

export function fetchProducts() {
  return httpClient.data<ShopProduct[]>('/shop/products');
}

export async function checkoutShop(payload: ShopCheckoutPayload): Promise<ShopCheckoutResponse> {
  return httpClient.data<ShopCheckoutResponse>('/shop/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
