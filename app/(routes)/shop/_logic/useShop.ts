"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { FEATURED_SLUG, PRODUCTS, type Color, type Product, type Size, type Variant } from "../_data/products";

export type Sort = "recommended" | "price-asc" | "price-desc" | "newest" | "popular";

export type Filters = {
  category?: Product["category"] | "all";
  sizes?: Size[];
  colors?: Color[];
  inStock?: boolean;
  min?: number;
  max?: number;
};

export type CartItem = { productId: string; variantId: string; qty: number };

type CartState = CartItem[];

const defaultFilters: Filters = {
  category: "all",
  sizes: [],
  colors: [],
  inStock: false,
};

const sorters: Record<Sort, (a: Product, b: Product) => number> = {
  recommended: () => 0,
  "price-asc": (a, b) => minPrice(a) - minPrice(b),
  "price-desc": (a, b) => minPrice(b) - minPrice(a),
  newest: (a, b) => (b.badges?.includes("new") ? 1 : 0) - (a.badges?.includes("new") ? 1 : 0),
  popular: (a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0),
};

const listeners = new Set<() => void>();
let cartState: CartState = [];

const getCartSnapshot = () => cartState;

const setCartState = (next: CartState | ((current: CartState) => CartState)) => {
  cartState = typeof next === "function" ? (next as (current: CartState) => CartState)(cartState) : next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const minPrice = (product: Product) => Math.min(...product.variants.map((variant) => variant.price));

const applyFilters = (items: Product[], filters: Filters) => {
  const category = filters.category && filters.category !== "all" ? filters.category : undefined;
  const sizes = filters.sizes ?? [];
  const colors = filters.colors ?? [];
  const min = filters.min ?? undefined;
  const max = filters.max ?? undefined;
  const inStock = Boolean(filters.inStock);

  return items.filter((product) => {
    if (category && product.category !== category) return false;
    if (sizes.length && !product.variants.some((variant) => sizes.includes(variant.size))) return false;
    if (colors.length && !product.variants.some((variant) => colors.includes(variant.color))) return false;
    if (typeof min === "number" && !product.variants.some((variant) => variant.price >= min)) return false;
    if (typeof max === "number" && !product.variants.some((variant) => variant.price <= max)) return false;
    if (inStock && !product.variants.some((variant) => variant.stock > 0)) return false;
    return true;
  });
};

export const useCatalog = () => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>("recommended");

  const list = useMemo(() => {
    const filtered = applyFilters(PRODUCTS, filters);
    const sorter = sorters[sort];
    return [...filtered].sort(sorter);
  }, [filters, sort]);

  return {
    list,
    all: PRODUCTS,
    filters,
    setFilters,
    sort,
    setSort,
    featured: PRODUCTS.find((product) => product.slug === FEATURED_SLUG) ?? PRODUCTS[0],
  };
};

export type CartEntry = CartItem & { product: Product; variant: Variant; lineTotal: number };

export const useCart = () => {
  const items = useSyncExternalStore(subscribe, getCartSnapshot, getCartSnapshot);

  const add = useCallback((item: CartItem) => {
    setCartState((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (existing) {
        return current.map((entry) =>
          entry.variantId === item.variantId ? { ...entry, qty: entry.qty + item.qty } : entry,
        );
      }
      return [...current, item];
    });
  }, []);

  const remove = useCallback((variantId: string) => {
    setCartState((current) => current.filter((entry) => entry.variantId !== variantId));
  }, []);

  const clear = useCallback(() => {
    setCartState([]);
  }, []);

  const detailed = useMemo<CartEntry[]>(() => {
    return items
      .map((entry) => {
        const product = PRODUCTS.find((candidate) => candidate.id === entry.productId);
        const variant = product?.variants.find((candidate) => candidate.id === entry.variantId);
        if (!product || !variant) return undefined;
        return {
          ...entry,
          product,
          variant,
          lineTotal: variant.price * entry.qty,
        } satisfies CartEntry;
      })
      .filter((value): value is CartEntry => Boolean(value));
  }, [items]);

  const total = useMemo(() => detailed.reduce((sum, entry) => sum + entry.lineTotal, 0), [detailed]);

  return { items: detailed, add, remove, clear, total };
};

export const getProductBySlug = (slug: string) => PRODUCTS.find((product) => product.slug === slug);

export const getVariantById = (variantId: string) => {
  for (const product of PRODUCTS) {
    const variant = product.variants.find((candidate) => candidate.id === variantId);
    if (variant) return { product, variant } as const;
  }
  return undefined;
};
