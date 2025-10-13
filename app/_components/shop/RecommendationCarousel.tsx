"use client";

import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/app/_data/shop_v2";
import { formatCurrency } from "@/app/_data/shop_v2";

type Recommendation = {
  product: Product;
  reason: string;
};

type RecommendationCarouselProps = {
  items: Recommendation[];
};

const RecommendationCarousel = ({ items }: RecommendationCarouselProps) => {
  if (items.length === 0) {
    return (
      <div className="card break-words whitespace-normal break-words whitespace-normal text-white/80" role="status">
        No personalised drops yet — explore featured gear while we learn your style.
      </div>
    );
  }

  return (
    <div className="h-scroll flex gap-4" role="list">
      {items.map(({ product, reason }) => (
        <article key={product.id} className="card break-words whitespace-normal break-words whitespace-normal min-w-[220px] space-y-4" role="listitem">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10 p-4">
            <Image src={product.images[0]} alt={product.name} width={180} height={180} className="h-full w-full object-contain" />
            {product.badges?.includes("exclusive") ? (
              <span className="chip absolute left-3 top-3 bg-purple-500/30 text-purple-100">Member boost</span>
            ) : null}
          </div>
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold text-white">{product.name}</h3>
              <p className="text-xs uppercase tracking-wide text-white/60">{reason}</p>
            </div>
            <div className="flex items-baseline gap-2 text-white">
              <span className="text-xl font-semibold">{formatCurrency(product.price)}</span>
              {product.compareAt ? (
                <span className="text-xs text-white/60 line-through">{formatCurrency(product.compareAt)}</span>
              ) : null}
            </div>
          </div>
          <Link className="btn w-full text-center" href={`/shop/${product.slug}`} prefetch>
            View detail
          </Link>
        </article>
      ))}
    </div>
  );
};

export default RecommendationCarousel;
