"use client";

import Image from "next/image";
import Link from "next/link";

import type { Bundle, Product } from "@/app/_data/shop_v2";
import { formatCurrency } from "@/app/_data/shop_v2";

type BundleCardProps = {
  bundle: Bundle;
  products: Product[];
};

const BundleCard = ({ bundle, products }: BundleCardProps) => {
  const bundleProducts = bundle.items
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  if (bundleProducts.length === 0) {
    return null;
  }

  const totalCompare = bundleProducts.reduce((total, product) => total + (product.compareAt ?? product.price), 0);

  return (
    <article className="card flex min-w-[240px] flex-col gap-4" role="listitem">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{bundle.title}</h3>
        {bundle.savingsLabel ? (
          <span className="chip bg-emerald-500/20 text-emerald-100">{bundle.savingsLabel}</span>
        ) : null}
      </div>
      <div className="flex gap-4">
        {bundleProducts.map((product) => (
          <div key={product.id} className="relative aspect-square w-24 overflow-hidden rounded-2xl bg-white/10 p-3">
            <Image src={product.images[0]} alt={product.name} width={120} height={120} className="h-full w-full object-contain" />
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm text-white/80">
        <p>{bundleProducts.map((product) => product.name).join(" + ")}</p>
        <div className="flex items-baseline gap-3 text-white">
          <span className="text-xl font-semibold">{formatCurrency(bundle.price)}</span>
          <span className="text-xs uppercase tracking-wide text-white/50">
            {formatCurrency(totalCompare)} value
          </span>
        </div>
      </div>
      <Link className="btn-primary text-center" href={`/shop/${bundleProducts[0].slug}`} prefetch>
        View bundle
      </Link>
    </article>
  );
};

export default BundleCard;
