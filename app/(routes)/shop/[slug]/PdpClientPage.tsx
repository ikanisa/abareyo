"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Truck } from "lucide-react";

import PDPGallery from "../_components/PDPGallery";
import UssdPayButton from "../_components/UssdPayButton";
import VariantSelector from "../_components/VariantSelector";
import ProductRail from "../_components/ProductRail";
import type { SizeGuideModalProps } from "../_components/SizeGuideModal";
// Explicitly import the modal prop type once for type safety on dynamic import
import type { Product } from "../_data/products";
import { formatPrice, getCrossSell, recordRecentlyViewed, useCart, useRecentlyViewed } from "../_logic/useShop";
import { ShopLocaleProvider, useShopLocale, type ShopLocale } from "../_hooks/useShopLocale";

const SizeGuideModal = dynamic<SizeGuideModalProps>(
  () => import("../_components/SizeGuideModal").then((mod) => mod.default),
  { ssr: false },
);

type Props = {
  product: Product;
  initialLocale?: ShopLocale;
};

const PdpClientPage = ({ product, initialLocale }: Props) => (
  <ShopLocaleProvider initialLocale={initialLocale}>
    <PdpContent product={product} />
  </ShopLocaleProvider>
);

const PdpContent = ({ product }: { product: Product }) => {
  const [variant, setVariant] = useState(product.variants[0]);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem } = useCart();
  const recentlyViewed = useRecentlyViewed(product.slug);
  const crossSell = useMemo(() => getCrossSell(product), [product]);
  const { t } = useShopLocale();
  const backCopy = t("pdp.back");
  const detailsCopy = t("pdp.detailsTitle");
  const bundleCopy = t("pdp.bundleIncludes");
  const completeTitle = t("pdp.complete");
  const completeCaption = t("pdp.completeCaption");
  const recentTitle = t("pdp.recent");
  const recentCaption = t("pdp.recentCaption");

  useEffect(() => {
    setVariant(product.variants[0]);
    recordRecentlyViewed(product.slug);
  }, [product]);

  const addToCart = () => {
    addItem({ productId: product.id, variantId: variant.id, qty: 1 });
  };

  return (
    <div className="min-h-screen bg-rs-gradient pb-24 text-white">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-8">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="self-start rounded-full bg-white/10 px-4 py-2 text-left text-sm text-white/70"
        >
          {backCopy.primary}
          <span className="block text-[11px] text-white/60">{backCopy.secondary}</span>
        </button>
        <PDPGallery product={product} />
        <section className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="text-sm text-white/70">
            {t("pdp.subtitle").primary}
            <span className="block text-xs text-white/60">{t("pdp.subtitle").secondary}</span>
          </p>
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span>{formatPrice(variant.price)}</span>
            {variant.compareAt && variant.compareAt > variant.price && (
              <span className="text-sm text-white/60 line-through">{formatPrice(variant.compareAt)}</span>
            )}
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
              {t("pdp.membersSave").primary}
              <span className="block text-[10px] font-normal text-white/60">{t("pdp.membersSave").secondary}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t("pdp.trustOne").primary}
              <span className="block text-[10px] text-white/60">{t("pdp.trustOne").secondary}</span>
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t("pdp.trustTwo").primary}
              <span className="block text-[10px] text-white/60">{t("pdp.trustTwo").secondary}</span>
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t("pdp.trustThree").primary}
              <span className="block text-[10px] text-white/60">{t("pdp.trustThree").secondary}</span>
            </span>
          </div>
        </section>

        <VariantSelector product={product} value={variant} onChange={setVariant} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSizeGuideOpen(true)}
            className="btn flex-1 rounded-2xl text-sm font-semibold"
          >
            {t("pdp.sizeGuide").primary}
            <span className="block text-[11px] font-normal text-white/60">{t("pdp.sizeGuide").secondary}</span>
          </button>
          <button
            type="button"
            onClick={addToCart}
            className="btn-primary flex-1 rounded-2xl text-sm font-semibold"
            disabled={variant.stock === 0}
          >
            {t("pdp.addToCart").primary}
            <span className="block text-[11px] font-normal text-white/60">{t("pdp.addToCart").secondary}</span>
          </button>
        </div>

        <UssdPayButton amount={variant.price} phoneNumber="0780000000" />

        <section className="card break-words whitespace-normal space-y-3 bg-white/10">
          <h2 className="text-lg font-semibold text-white">
            {detailsCopy.primary}
            <span className="block text-sm font-normal text-white/70">{detailsCopy.secondary}</span>
          </h2>
          <ul className="space-y-2 text-sm text-white/80">
            {product.materials && <li>{product.materials}</li>}
            {product.care && <li>{product.care}</li>}
            {product.fit && <li>{product.fit}</li>}
            {product.shipping && (
              <li className="flex items-start gap-2">
                <Truck className="mt-1 h-4 w-4 text-white/60" aria-hidden />
                <span>{product.shipping}</span>
              </li>
            )}
            {product.returnPolicy && (
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-1 h-4 w-4 text-white/60" aria-hidden />
                <span>{product.returnPolicy}</span>
              </li>
            )}
          </ul>
          {product.bundleItems && (
            <div className="rounded-2xl bg-white/10 p-3 text-sm text-white/70">
              <p className="font-semibold text-white">
                {bundleCopy.primary}
                <span className="block text-xs font-normal text-white/60">{bundleCopy.secondary}</span>
              </p>
              <ul className="list-disc pl-5">
                {product.bundleItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <ProductRail title={completeTitle} caption={completeCaption} items={crossSell} />
        <ProductRail title={recentTitle} caption={recentCaption} items={recentlyViewed} />
      </main>
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
};

export default PdpClientPage;
