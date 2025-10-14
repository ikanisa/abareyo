"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  category: string;
};

type ShopCatalogProps = {
  products: CatalogProduct[];
};

const filters = [
  { id: "all", label: "All", match: () => true },
  { id: "jerseys", label: "Jerseys", match: (product: CatalogProduct) => product.category === "Jerseys" },
  { id: "training", label: "Training", match: (product: CatalogProduct) => product.category === "Training" },
  { id: "accessories", label: "Accessories", match: (product: CatalogProduct) => product.category === "Accessories" },
  {
    id: "deals",
    label: "Deals",
    match: (product: CatalogProduct) =>
      typeof product.compareAt === "number" && product.compareAt > product.price,
  },
] as const;

const formatPrice = (value: number) => `RWF ${value.toLocaleString()}`;

export default function ShopCatalog({ products }: ShopCatalogProps) {
  const [activeFilter, setActiveFilter] = useState<string>(filters[0].id);

  const filtered = useMemo(() => {
    const selected = filters.find((filter) => filter.id === activeFilter) ?? filters[0];
    return products.filter((product) => selected.match(product));
  }, [activeFilter, products]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive ? "bg-white text-black" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={isActive}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product) => (
          <Link key={product.id} href={`/shop/${product.slug}`} className="card block space-y-1">
            <div className="h-32 rounded-2xl bg-white/10" aria-hidden />
            <h2 className="text-sm font-semibold text-white">{product.name}</h2>
            <p className="text-xs text-white/80">{formatPrice(product.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
