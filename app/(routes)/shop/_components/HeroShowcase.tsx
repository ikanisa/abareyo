"use client";

import Image from "next/image";
import Link from "next/link";

import useShopLocale from "../_hooks/useShopLocale";
import { minPrice } from "../_logic/useShop";
import type { Product } from "../_data/products";

type HeroShowcaseProps = {
  product: Product;
};

const HeroShowcase = ({ product }: HeroShowcaseProps) => {
  const strings = useShopLocale();
  const price = minPrice(product);
  const heroImage = product.images[0];
  const priceLabel = new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <section className="card bg-white/10 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-white/10 md:h-56 md:w-1/2">
          {heroImage ? (
            <Image src={heroImage} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : null}
        </div>
        <div className="flex-1 space-y-3">
          <span className="tile inline-flex w-auto px-3 py-1 text-xs">{strings.official}</span>
          <h2 className="text-2xl font-semibold text-white">{product.name}</h2>
          {product.description ? <p className="text-sm text-white/70">{product.description}</p> : null}
          <p className="text-lg font-semibold text-white">{priceLabel}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/shop/${product.slug}`} className="btn-primary">
              {strings.buy}
            </Link>
            <Link href="/cart" className="btn">
              Cart
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroShowcase;
