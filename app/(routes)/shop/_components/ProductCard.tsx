"use client";

import Image from "next/image";
import Link from "next/link";

import useShopLocale from "../_hooks/useShopLocale";
import { minPrice, useCart, type CartItem } from "../_logic/useShop";
import type { Product } from "../_data/products";

const badgeClass = "rounded-full bg-white/15 px-3 py-1 text-xs text-white";

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const strings = useShopLocale();
  const { add } = useCart();
  const lowestPrice = minPrice(product);
  const cheapestVariant = product.variants[0];
  const image = product.images[0];

  const handleAdd = () => {
    if (!cheapestVariant) return;
    const item: CartItem = {
      productId: product.id,
      variantId: cheapestVariant.id,
      qty: 1,
    };
    add(item);
  };

  const priceLabel = new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(lowestPrice);

  return (
    <article className="card flex flex-col gap-3 bg-white/10">
      <Link href={`/shop/${product.slug}`} className="space-y-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/10">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 280px" />
          ) : null}
        </div>
        <div className="space-y-2 px-1">
          <div className="flex flex-wrap gap-2">
            {product.badges?.includes("official") ? <span className={badgeClass}>{strings.official}</span> : null}
            {product.badges?.includes("new") ? <span className={badgeClass}>{strings.new}</span> : null}
            {product.badges?.includes("sale") ? <span className={badgeClass}>{strings.sale}</span> : null}
            {product.badges?.includes("limited") ? <span className={badgeClass}>{strings.limited}</span> : null}
          </div>
          <h3 className="text-base font-semibold text-white">{product.name}</h3>
          {product.description ? (
            <p className="text-sm text-white/70 line-clamp-2">{product.description}</p>
          ) : null}
          <p className="text-lg font-semibold text-white">{priceLabel}</p>
        </div>
      </Link>
      <button type="button" className="btn" onClick={handleAdd}>
        {strings.addToCart}
      </button>
    </article>
  );
};

export default ProductCard;
