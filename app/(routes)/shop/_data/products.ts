export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type Color = 'blue' | 'white' | 'black';

import type { LocalizedField } from "./locales";

import catalogue from "./catalogue.json";

export type Variant = {
  id: string;
  size: Size;
  color: Color;
  sku: string;
  stock: number;
  price: number;
  compareAt?: number;
};

export type ProductBadge = 'official' | 'new' | 'sale' | 'limited';

export type ProductImage = {
  src: string;
  alt: LocalizedField;
};

export type Product = {
  id: string;
  name: LocalizedField;
  slug: string;
  category: 'jerseys' | 'training' | 'lifestyle' | 'accessories' | 'bundles';
  description: LocalizedField;
  heroCopy?: LocalizedField;
  images: ProductImage[];
  variants: Variant[];
  badges?: ProductBadge[];
  tags?: ('Official' | 'Replica' | 'Kids')[];
  materials?: LocalizedField;
  care?: LocalizedField;
  fit?: LocalizedField;
  shipping?: LocalizedField;
  returnPolicy?: LocalizedField;
  bundleItems?: LocalizedField[];
};

const rawCatalogue = catalogue as unknown as Product[];

export const PRODUCTS: Product[] = rawCatalogue.map((product) => ({
  ...product,
  images: product.images.map((image) => ({ ...image })),
  variants: product.variants.map((variant) => ({ ...variant })),
  badges: product.badges ? [...product.badges] : undefined,
  tags: product.tags ? [...product.tags] : undefined,
  bundleItems: product.bundleItems ? product.bundleItems.map((item) => ({ ...item })) : undefined,
}));

export const FEATURED_SLUG = 'home-jersey-24-25';
