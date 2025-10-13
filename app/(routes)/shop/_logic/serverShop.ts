import { PRODUCTS } from "../_data/products";
import type { Product } from "../_data/products";

export const getProductBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((product) => product.slug === slug);
