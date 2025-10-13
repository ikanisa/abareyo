"use client";

import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";
import type { Product } from "../_data/products";
import { useShopLocale } from "../_hooks/useShopLocale";

type ProductGridProps = {
  items: Product[];
  isLoading?: boolean;
};

const ProductGrid = ({ items, isLoading = false }: ProductGridProps) => {
  const { t } = useShopLocale();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    const emptyCopy = t("grid.empty");
    return (
      <div className="card break-words whitespace-normal text-center text-sm text-white/80">
        {emptyCopy.primary}
        <span className="block text-xs text-white/60">{emptyCopy.secondary}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
