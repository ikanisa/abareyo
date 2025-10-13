"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import type { Product } from "../_data/products";
import ProductCard from "./ProductCard";
import { useShopLocale, type BilingualString } from "../_hooks/useShopLocale";

type ProductRailProps = {
  title: BilingualString;
  caption?: BilingualString;
  href?: string;
  items: Product[];
};

const ProductRail = ({ title, caption, href, items }: ProductRailProps) => {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useShopLocale();
  const viewAllCopy = t("rail.viewAll");

  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">
            {title.primary}
            <span className="block text-sm font-normal text-white/70">{title.secondary}</span>
          </h3>
          {caption && (
            <p className="text-sm text-white/70">
              {caption.primary}
              <span className="block text-xs text-white/60">{caption.secondary}</span>
            </p>
          )}
        </div>
        {href && (
          <Link href={href} className="text-xs font-semibold text-white underline">
            {viewAllCopy.primary}
            <span className="block text-[10px] text-white/70">{viewAllCopy.secondary}</span>
          </Link>
        )}
      </div>
      <motion.div className="h-scroll flex gap-3 pb-2" layoutScroll={!prefersReducedMotion}>
        {items.map((product) => (
          <div key={product.id} className="min-w-[220px] max-w-[220px] flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </motion.div>
    </section>
  );
};

export default ProductRail;
