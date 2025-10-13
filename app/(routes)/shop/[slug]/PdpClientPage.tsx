"use client";

import { useMemo, useState } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";

import PDPGallery from "../_components/PDPGallery";
import SizeGuideModal from "../_components/SizeGuideModal";
import UssdPayButton from "../_components/UssdPayButton";
import useShopLocale from "../_hooks/useShopLocale";
import { useCart, type CartItem } from "../_logic/useShop";
import type { Product, Variant } from "../_data/products";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(value);

type PdpClientPageProps = {
  product: Product;
};

const PdpClientPage = ({ product }: PdpClientPageProps) => {
  const strings = useShopLocale();
  const { add } = useCart();
  const [variant, setVariant] = useState<Variant>(product.variants[0]);

  const price = formatPrice(variant.price);
  const isOutOfStock = variant.stock <= 0;

  const options = useMemo(() => ({
    sizes: Array.from(new Set(product.variants.map((entry) => entry.size))),
    colors: Array.from(new Set(product.variants.map((entry) => entry.color))),
  }), [product.variants]);

  const handleAdd = () => {
    const item: CartItem = { productId: product.id, variantId: variant.id, qty: 1 };
    add(item);
  };

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={<SizeGuideModal />} />
      <PDPGallery product={product} />

      <section className="card space-y-3 bg-white/10 p-5">
        <div className="flex flex-wrap gap-2">
          {product.badges?.map((badge) => (
            <span key={badge} className="tile inline-flex w-auto px-3 py-1 text-xs">
              {strings[badge] ?? badge}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-semibold text-white">{product.name}</h1>
        {product.description ? <p className="text-sm text-white/70">{product.description}</p> : null}
        <p className="text-lg font-semibold text-white">{price}</p>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/80">{strings.size}</h2>
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`btn ${variant.size === size ? "bg-white text-slate-900" : ""}`}
                onClick={() => {
                  const next = product.variants.find((entry) => entry.size === size && entry.color === variant.color);
                  if (next) setVariant(next);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/80">{strings.color}</h2>
          <div className="flex flex-wrap gap-2">
            {options.colors.map((color) => (
              <button
                key={color}
                type="button"
                className={`btn ${variant.color === color ? "bg-white text-slate-900" : ""}`}
                onClick={() => {
                  const next = product.variants.find((entry) => entry.color === color && entry.size === variant.size);
                  if (next) setVariant(next);
                }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button type="button" className="btn-primary w-full" onClick={handleAdd} disabled={isOutOfStock}>
            {isOutOfStock ? strings.outOfStock : strings.addToCart}
          </button>
          <UssdPayButton amount={variant.price} />
        </div>
      </section>
    </PageShell>
  );
};

export default PdpClientPage;
