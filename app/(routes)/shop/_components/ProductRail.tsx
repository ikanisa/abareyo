"use client";

import type { Product } from "../_data/products";
import ProductCard from "./ProductCard";

type ProductRailProps = {
  title: string;
  products: Product[];
};

const ProductRail = ({ title, products }: ProductRailProps) => {
  if (!products.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="section-title">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-60 flex-none">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductRail;
