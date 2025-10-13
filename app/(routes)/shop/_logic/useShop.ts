"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  FEATURED_SLUG,
  PRODUCTS,
  type Color,
  type Product,
  type Size,
  type Variant,
} from "../_data/products";
import type { CopyKey } from "../_hooks/useShopLocale";

export type SortOption = "recommended" | "price-asc" | "price-desc" | "newest" | "popular";

export type FilterTag = "Official" | "Replica" | "Kids";

export type FilterState = {
  category?: Product["category"];
  sizes: Size[];
  colors: Color[];
  inStock: boolean;
  min?: number;
  max?: number;
  tags: FilterTag[];
};

type CategoryFilter = {
  key: "category";
  kind: "category";
  value: Product["category"];
  label: string;
};

type SizeFilter = { key: "size"; kind: "size"; value: Size; label: string };

type ColorFilter = { key: "color"; kind: "color"; value: Color; label: string };

type TagFilter = { key: "tag"; kind: "tag"; value: FilterTag; label: string };

type PriceFilter = {
  key: "price";
  kind: "price";
  label: string;
  min?: number;
  max?: number;
};

type StockFilter = { key: "stock"; kind: "stock"; label: string };

type SearchFilter = { key: "q"; kind: "search"; value: string; label: string };

export type ActiveFilter =
  | CategoryFilter
  | SizeFilter
  | ColorFilter
  | TagFilter
  | PriceFilter
  | StockFilter
  | SearchFilter;

type RailSection = {
  items: Product[];
  titleKey: CopyKey;
  captionKey: CopyKey;
};

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  "price-asc": "Price ↑",
  "price-desc": "Price ↓",
  newest: "Newest",
  popular: "Popular",
};

export type PaymentMethod = "mtn" | "airtel";

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  descriptionRw: string;
  prefix: string;
}[] = [
  {
    id: "mtn",
    label: "MTN MoMo",
    description: "Pay with MTN Mobile Money",
    descriptionRw: "Ishura ukoresheje MTN Mobile Money",
    prefix: "*182*1*1*",
  },
  {
    id: "airtel",
    label: "Airtel Money",
    description: "Pay with Airtel Money",
    descriptionRw: "Ishura ukoresheje Airtel Money",
    prefix: "*500*1*1*",
  },
];

export type ShopTab = {
  id: string;
  labelKey: CopyKey;
  descriptionKey: CopyKey;
  category?: Product["category"];
};

export const SHOP_TABS: ShopTab[] = [
  { id: "featured", labelKey: "tabs.featured.label", descriptionKey: "tabs.featured.description" },
  {
    id: "jerseys",
    labelKey: "tabs.jerseys.label",
    descriptionKey: "tabs.jerseys.description",
    category: "jerseys",
  },
  {
    id: "training",
    labelKey: "tabs.training.label",
    descriptionKey: "tabs.training.description",
    category: "training",
  },
  {
    id: "lifestyle",
    labelKey: "tabs.lifestyle.label",
    descriptionKey: "tabs.lifestyle.description",
    category: "lifestyle",
  },
  {
    id: "accessories",
    labelKey: "tabs.accessories.label",
    descriptionKey: "tabs.accessories.description",
    category: "accessories",
  },
  {
    id: "bundles",
    labelKey: "tabs.bundles.label",
    descriptionKey: "tabs.bundles.description",
    category: "bundles",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(value);

export const minPrice = (product: Product) => Math.min(...product.variants.map((variant) => variant.price));
export const maxPrice = (product: Product) => Math.max(...product.variants.map((variant) => variant.price));

const parseNumber = (value: string | null | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseFilters = (params: URLSearchParams): FilterState => {
  const category = params.get("category") as Product["category"] | null;
  const sizes = params.getAll("size") as Size[];
  const colors = params.getAll("color") as Color[];
  const tags = params.getAll("tag") as FilterTag[];
  const inStock = params.get("stock") === "1";
  const min = parseNumber(params.get("min"));
  const max = parseNumber(params.get("max"));
  return {
    category: category ?? undefined,
    sizes,
    colors,
    inStock,
    min,
    max,
    tags,
  };
};

const buildQueryString = (params: URLSearchParams) => {
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const useCatalog = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive the current search string from the router.  We treat it as the source of truth for
  // all URL-derived state (filters, sort, search input, etc.).
  const searchParamsString = searchParams?.toString() ?? "";

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Create a stable URLSearchParams instance so downstream memoised calculations can re-use it
  // instead of instantiating fresh objects on every render.
  const currentParams = useMemo(() => new URLSearchParams(searchParamsString), [searchParamsString]);

  // Parse filters (category, price, etc.) from the current query parameters once.
  const filters = useMemo(() => parseFilters(currentParams), [currentParams]);
  const activeTabId = currentParams.get("tab") ?? (filters.category ?? "featured");
  const sort = (currentParams.get("sort") as SortOption | null) ?? "recommended";
  const query = (currentParams.get("q") ?? "").toLowerCase();

  // Keep a local copy of the `q` parameter for the search input.  Whenever the URL changes,
  // rehydrate this state from the memoised params instance.
  const [searchInput, setSearchInput] = useState(() => currentParams.get("q") ?? "");
  useEffect(() => {
    setSearchInput(currentParams.get("q") ?? "");
  }, [currentParams]);

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParamsString);
      updater(next);
      router.replace(`${pathname}${buildQueryString(next)}`, { scroll: false });
    },
    [pathname, router, searchParamsString],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      updateParams((params) => {
        if (searchInput.trim()) {
          params.set("q", searchInput.trim());
        } else {
          params.delete("q");
        }
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchInput, updateParams]);

  const setSort = useCallback(
    (value: SortOption) => {
      updateParams((params) => {
        if (value === "recommended") params.delete("sort");
        else params.set("sort", value);
      });
    },
    [updateParams],
  );

  const setCategory = useCallback(
    (category?: Product["category"]) => {
      updateParams((params) => {
        params.delete("category");
        params.delete("tab");
        if (category) {
          params.set("category", category);
          params.set("tab", category);
        }
      });
    },
    [updateParams],
  );

  const toggleMultiFilter = useCallback(
    (key: "size" | "color" | "tag", value: string) => {
      updateParams((params) => {
        const existing = new Set(params.getAll(key));
        if (existing.has(value)) existing.delete(value);
        else existing.add(value);
        params.delete(key);
        existing.forEach((entry) => params.append(key, entry));
      });
    },
    [updateParams],
  );

  const setAvailability = useCallback(
    (value: boolean) => {
      updateParams((params) => {
        if (value) params.set("stock", "1");
        else params.delete("stock");
      });
    },
    [updateParams],
  );

  const setPriceRange = useCallback(
    (min?: number, max?: number) => {
      updateParams((params) => {
        if (min != null) params.set("min", String(min));
        else params.delete("min");
        if (max != null) params.set("max", String(max));
        else params.delete("max");
      });
    },
    [updateParams],
  );

  const clearFilter = useCallback(
    (key: string, value?: string) => {
      updateParams((params) => {
        if (key === "price") {
          params.delete("min");
          params.delete("max");
          return;
        }
        if (key === "stock") {
          params.delete("stock");
          return;
        }
        if (key === "q") {
          params.delete("q");
          return;
        }
        if (value) {
          const existing = new Set(params.getAll(key));
          existing.delete(value);
          params.delete(key);
          existing.forEach((entry) => params.append(key, entry));
        } else {
          params.delete(key);
        }
      });
    },
    [updateParams],
  );

  const clearAllFilters = useCallback(() => {
    updateParams((params) => {
      ["category", "size", "color", "stock", "min", "max", "tag", "tab", "sort", "q"].forEach((key) =>
        params.delete(key),
      );
    });
  }, [updateParams]);

  const items = useMemo(() => {
    const base = filters.category
      ? PRODUCTS.filter((product) => product.category === filters.category)
      : PRODUCTS.slice();

    const searchFiltered = query
      ? base.filter((product) =>
          `${product.name} ${product.description} ${product.tags?.join(" ") ?? ""}`
            .toLowerCase()
            .includes(query),
        )
      : base;

    const withSize = filters.sizes.length
      ? searchFiltered.filter((product) =>
          product.variants.some((variant) => filters.sizes.includes(variant.size)),
        )
      : searchFiltered;

    const withColor = filters.colors.length
      ? withSize.filter((product) =>
          product.variants.some((variant) => filters.colors.includes(variant.color)),
        )
      : withSize;

    const withTags = filters.tags.length
      ? withColor.filter((product) => product.tags?.some((tag) => filters.tags.includes(tag as never)))
      : withColor;

    const withPrice = withTags.filter((product) => {
      const min = filters.min ?? 0;
      const max = filters.max ?? Number.POSITIVE_INFINITY;
      return product.variants.some((variant) => variant.price >= min && variant.price <= max);
    });

    const stockFiltered = filters.inStock
      ? withPrice.filter((product) => product.variants.some((variant) => variant.stock > 0))
      : withPrice;

    const sorted = [...stockFiltered];
    if (sort === "price-asc") sorted.sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === "price-desc") sorted.sort((a, b) => minPrice(b) - minPrice(a));
    if (sort === "popular")
      sorted.sort(
        (a, b) =>
          (b.badges?.includes("official") ? 1 : 0) + (b.badges?.includes("limited") ? 1 : 0) -
          ((a.badges?.includes("official") ? 1 : 0) + (a.badges?.includes("limited") ? 1 : 0)),
      );
    if (sort === "newest")
      sorted.sort((a, b) => (b.badges?.includes("new") ? 1 : 0) - (a.badges?.includes("new") ? 1 : 0));

    return sorted;
  }, [filters, query, sort]);

  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 260);
    return () => window.clearTimeout(timeout);
  }, []);

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const chips: ActiveFilter[] = [];
    if (filters.category) {
      const tab = SHOP_TABS.find((entry) => entry.category === filters.category);
      chips.push({
        key: "category",
        kind: "category",
        value: filters.category,
        label: `Category: ${tab ? tab.id : filters.category}`,
      });
    }
    filters.sizes.forEach((size) =>
      chips.push({ key: "size", kind: "size", value: size, label: `Size ${size}` }),
    );
    filters.colors.forEach((color) =>
      chips.push({ key: "color", kind: "color", value: color, label: color }),
    );
    filters.tags.forEach((tag) =>
      chips.push({ key: "tag", kind: "tag", value: tag, label: tag }),
    );
    if (filters.min != null || filters.max != null) {
      const from = filters.min != null ? `from ${formatCurrency(filters.min)}` : "";
      const to = filters.max != null ? `to ${formatCurrency(filters.max)}` : "";
      chips.push({
        key: "price",
        kind: "price",
        label: `Price ${`${from} ${to}`.trim()}`.trim(),
        min: filters.min,
        max: filters.max,
      });
    }
    if (filters.inStock)
      chips.push({ key: "stock", kind: "stock", label: "In stock" });
    if (query)
      chips.push({ key: "q", kind: "search", value: query, label: `Search: ${query}` });
    return chips;
  }, [filters, query]);

  const sections = useMemo(() => {
    const hero = PRODUCTS.find((product) => product.slug === FEATURED_SLUG) ?? PRODUCTS[0];
    const topPicks = PRODUCTS.filter(
      (product) => product.badges?.includes("limited") || product.badges?.includes("official"),
    ).slice(0, 5);
    const newArrivals = PRODUCTS.filter((product) => product.badges?.includes("new"));
    const deals = PRODUCTS.filter((product) => product.badges?.includes("sale"));
    const fanFavorites = PRODUCTS.filter(
      (product) => product.badges?.includes("official") || product.badges?.includes("limited"),
    ).slice(0, 4);
    return {
      hero,
      topPicks: {
        items: topPicks,
        titleKey: "section.topPicks.title",
        captionKey: "section.topPicks.caption",
      },
      newArrivals: {
        items: newArrivals,
        titleKey: "section.newArrivals.title",
        captionKey: "section.newArrivals.caption",
      },
      deals: {
        items: deals,
        titleKey: "section.deals.title",
        captionKey: "section.deals.caption",
      },
      fanFavorites: {
        items: fanFavorites,
        titleKey: "section.fanFavorites.title",
        captionKey: "section.fanFavorites.caption",
      },
    } satisfies {
      hero: Product;
      topPicks: RailSection;
      newArrivals: RailSection;
      deals: RailSection;
      fanFavorites: RailSection;
    };
  }, []);

  const categories = useMemo(() => {
    const counts = PRODUCTS.reduce<Record<string, number>>((accumulator, product) => {
      accumulator[product.category] = (accumulator[product.category] ?? 0) + 1;
      return accumulator;
    }, {});
    return SHOP_TABS.map((tab) => ({
      id: tab.id,
      labelKey: tab.labelKey,
      descriptionKey: tab.descriptionKey,
      category: tab.category,
      count: tab.category ? counts[tab.category] ?? 0 : PRODUCTS.length,
    }));
  }, []);

  return {
    items,
    isLoading: isLoading && !hydrated,
    sort,
    sortLabel: SORT_LABELS[sort],
    setSort,
    searchInput,
    setSearchInput,
    filters,
    activeFilters,
    clearFilter,
    clearAllFilters,
    setCategory,
    toggleSize: (value: Size) => toggleMultiFilter("size", value),
    toggleColor: (value: Color) => toggleMultiFilter("color", value),
    toggleTag: (value: FilterTag) => toggleMultiFilter("tag", value),
    setAvailability,
    setPriceRange,
    sections,
    categories,
    activeTabId,
  };
};

export const getProductBySlug = (slug: string) => PRODUCTS.find((product) => product.slug === slug);

export const getVariantById = (variantId: string) => {
  for (const product of PRODUCTS) {
    const match = product.variants.find((variant) => variant.id === variantId);
    if (match) return { product, variant: match } as const;
  }
  return undefined;
};

export const getCrossSell = (product: Product) =>
  PRODUCTS.filter((candidate) => candidate.id !== product.id && candidate.category === product.category).slice(0, 3);

export const getRecentlyViewedSlugs = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("abareyo:recently-viewed");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse recently viewed", error);
    return [];
  }
};

const persistRecentlyViewed = (slugs: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("abareyo:recently-viewed", JSON.stringify(slugs.slice(0, 10)));
  } catch (error) {
    console.warn("Unable to persist recently viewed", error);
  }
};

export const recordRecentlyViewed = (slug: string) => {
  const current = getRecentlyViewedSlugs();
  const next = [slug, ...current.filter((entry) => entry !== slug)];
  persistRecentlyViewed(next);
};

export const useRecentlyViewed = (currentSlug?: string) => {
  const [recent, setRecent] = useState<Product[]>([]);
  useEffect(() => {
    const slugs = getRecentlyViewedSlugs().filter((slug) => slug !== currentSlug);
    const items = slugs
      .map((slug) => PRODUCTS.find((product) => product.slug === slug))
      .filter((product): product is Product => Boolean(product));
    setRecent(items.slice(0, 4));
  }, [currentSlug]);
  return recent;
};

export type CartItem = {
  productId: string;
  variantId: string;
  qty: number;
};

const CART_KEY = "abareyo:marketplace-cart";

type CartState = CartItem[];

const listeners = new Set<() => void>();
let cartState: CartState = [];

const loadCart = (): CartState => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item.productId === "string" && typeof item.variantId === "string" && item.qty > 0);
  } catch (error) {
    console.warn("Unable to parse cart", error);
    return [];
  }
};

if (typeof window !== "undefined") {
  cartState = loadCart();
}

const notify = () => listeners.forEach((listener) => listener());

const setCartState = (next: CartState | ((current: CartState) => CartState)) => {
  const updated = typeof next === "function" ? (next as (current: CartState) => CartState)(cartState) : next;
  cartState = updated;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cartState));
    } catch (error) {
      console.warn("Unable to persist cart", error);
    }
  }
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => cartState;

export type CartLineItem = {
  productId: string;
  variantId: string;
  qty: number;
  product: Product;
  variant: Variant;
  lineTotal: number;
};

export const useCart = () => {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback((item: CartItem) => {
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

  const updateItem = useCallback((variantId: string, qty: number) => {
    setCartState((current) =>
      qty <= 0
        ? current.filter((entry) => entry.variantId !== variantId)
        : current.map((entry) => (entry.variantId === variantId ? { ...entry, qty } : entry)),
    );
  }, []);

  const changeVariant = useCallback((currentVariantId: string, nextVariantId: string) => {
    if (currentVariantId === nextVariantId) return;
    setCartState((current) => {
      const targetVariant = getVariantById(nextVariantId);
      if (!targetVariant) return current;

      let quantityToCarry = 0;
      const withoutCurrent = current.reduce<CartState>((accumulator, entry) => {
        if (entry.variantId === currentVariantId) {
          quantityToCarry = entry.qty;
          return accumulator;
        }
        accumulator.push(entry);
        return accumulator;
      }, []);

      if (quantityToCarry <= 0) return withoutCurrent;

      const existingIndex = withoutCurrent.findIndex((entry) => entry.variantId === nextVariantId);
      if (existingIndex >= 0) {
        const clone = [...withoutCurrent];
        clone[existingIndex] = {
          ...clone[existingIndex],
          qty: clone[existingIndex].qty + quantityToCarry,
        };
        return clone;
      }

      return [
        ...withoutCurrent,
        {
          productId: targetVariant.product.id,
          variantId: nextVariantId,
          qty: quantityToCarry,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setCartState((current) => current.filter((entry) => entry.variantId !== variantId));
  }, []);

  const clear = useCallback(() => {
    setCartState([]);
  }, []);

  const detailedItems = useMemo(() => {
    return items
      .map((item) => {
        const match = getVariantById(item.variantId);
        if (!match) return undefined;
        return {
          ...item,
          product: match.product,
          variant: match.variant,
          lineTotal: match.variant.price * item.qty,
        } satisfies CartLineItem;
      })
      .filter((value): value is CartLineItem => Boolean(value));
  }, [items]);

  const total = detailedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const count = detailedItems.reduce((sum, item) => sum + item.qty, 0);

  return {
    items: detailedItems,
    raw: items,
    total,
    count,
    addItem,
    updateItem,
    changeVariant,
    removeItem,
    clear,
  };
};

export const createUssdCode = (msisdn: string, amount: number, method: PaymentMethod = "mtn") => {
  const digits = msisdn.replace(/[^0-9]/g, "");
  const safeAmount = Math.max(Math.floor(amount), 0);
  const config = PAYMENT_METHODS.find((entry) => entry.id === method) ?? PAYMENT_METHODS[0];
  const payload = `${config.prefix}${digits || "0780000000"}*${safeAmount}%23`;
  return `tel:${encodeURI(payload)}`;
};

export const formatPrice = formatCurrency;
