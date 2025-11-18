import { z } from 'zod';

import {
  RetailCheckoutRequestContract,
  RetailCheckoutResponseContract,
  RetailProductContract,
  retailSchemas,
} from '@rayon/api/contracts/retail';
import { httpClient } from '@/services/http-client';

const productListSchema = z.array(retailSchemas.product);

export function fetchProducts(): Promise<RetailProductContract[]> {
  return httpClient.data<RetailProductContract[]>('/shop/products').then((data) =>
    productListSchema.parse(data),
  );
}

export async function checkoutShop(
  payload: RetailCheckoutRequestContract,
): Promise<RetailCheckoutResponseContract> {
  const validatedPayload = retailSchemas.checkoutRequest.parse(payload);
  const data = await httpClient.data<RetailCheckoutResponseContract>('/shop/checkout', {
    method: 'POST',
    body: JSON.stringify(validatedPayload),
  });
  return retailSchemas.checkoutResponse.parse(data);
}
