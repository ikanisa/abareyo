"use client";

import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/app/_data/shop_v2";
import { formatCurrency } from "@/app/_data/shop_v2";

type ExclusiveCardProps = {
  product: Product;
  isMember: boolean;
  unlockLabel?: string;
};

const ExclusiveCard = ({ product, isMember, unlockLabel = "Gikundiro+ Only" }: ExclusiveCardProps) => {
  return (
    <article className="card relative flex min-w-[220px] flex-col gap-3" aria-disabled={!isMember}>
      <div className="relative overflow-hidden rounded-2xl bg-white/10 p-4">
        <Image src={product.images[0]} alt={product.name} width={200} height={200} className="h-full w-full object-contain" />
        {!isMember && (
          <div className="absolute inset-0 backdrop-blur-sm" aria-hidden>
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-blue-600/70 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide">
              {unlockLabel}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        <div className="flex items-baseline gap-2 text-white">
          <span className="text-xl font-semibold">{formatCurrency(product.price)}</span>
          {product.compareAt ? (
            <span className="text-xs text-white/60 line-through">{formatCurrency(product.compareAt)}</span>
          ) : null}
        </div>
      </div>
      {isMember ? (
        <Link className="btn-primary text-center" href={`/shop/${product.slug}`} prefetch>
          View drop
        </Link>
      ) : (
        <button
          type="button"
          className="btn w-full cursor-not-allowed bg-white/10 text-center text-white/60"
          disabled
        >
          Upgrade to unlock
        </button>
      )}
    </article>
  );
};

export default ExclusiveCard;
