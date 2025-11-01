"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, ShoppingBag } from "lucide-react";

import { formatPrice, minPrice, useCart } from "../_logic/useShop";
import { useShopLocale, type CopyKey } from "../_hooks/useShopLocale";
import type { Color, Product, Size } from "../_data/products";
import { OptimizedImage } from "@/components/ui/optimized-image";

const swatchColor: Record<string, string> = {
  blue: "#0033FF",
  white: "#FFFFFF",
  black: "#000000",
};

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const prefersReducedMotion = useReducedMotion();
  const [showSizes, setShowSizes] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const pressTimeout = useRef<number | null>(null);
  const { t } = useShopLocale();
  const officialCopy = t("product.genuine");
  const fallbackBadge = t("product.badgeFallback");

  const lowestPrice = minPrice(product);
  const compareAt = useMemo(() => {
    const prices = product.variants.map((variant) => variant.compareAt ?? 0).filter(Boolean);
    return prices.length ? Math.max(...prices) : undefined;
  }, [product.variants]);
  const hasSale = compareAt != null && compareAt > lowestPrice;
  const discountPercent = hasSale && compareAt ? Math.round(((compareAt - lowestPrice) / compareAt) * 100) : null;
  const saleBadgeCopy = discountPercent
    ? t("product.savePercent", { percent: discountPercent })
    : t("product.saleBadge");
  const colors = useMemo<Color[]>(() => {
    const unique = new Set<Color>();
    product.variants.forEach((variant) => {
      if (variant.color) unique.add(variant.color);
    });
    return Array.from(unique);
  }, [product.variants]);
  const sizes = useMemo<Size[]>(() => {
    const unique = new Set<Size>();
    product.variants.forEach((variant) => {
      if (variant.size) unique.add(variant.size);
    });
    return Array.from(unique);
  }, [product.variants]);
  const hasMultipleVariants = sizes.length > 1 || colors.length > 1;
  const hasMultipleImages = product.images.length > 1;
  const displayImage = product.images[imageIndex] ?? product.images[0];
  const firstInStock = useMemo(
    () => product.variants.find((variant) => variant.stock > 0) ?? product.variants[0],
    [product.variants],
  );

  useEffect(
    () => () => {
      if (pressTimeout.current) window.clearTimeout(pressTimeout.current);
    },
    [],
  );

  const handlePointerEnter = () => {
    if (hasMultipleImages) setImageIndex(1);
  };

  const handlePointerLeave = () => {
    if (pressTimeout.current) window.clearTimeout(pressTimeout.current);
    setImageIndex(0);
  };

  const handlePointerDown = () => {
    if (!hasMultipleImages) return;
    if (pressTimeout.current) window.clearTimeout(pressTimeout.current);
    pressTimeout.current = window.setTimeout(() => setImageIndex(1), 150);
  };

  const handlePointerUp = () => {
    if (pressTimeout.current) window.clearTimeout(pressTimeout.current);
    setImageIndex(0);
  };

  const toggleSizes = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowSizes((prev) => !prev);
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!firstInStock) return;
    addItem({ productId: product.id, variantId: firstInStock.id, qty: 1 });
  };

  const heroBadge = product.badges?.includes("official") ? officialCopy : fallbackBadge;
  const availableSizesCopy = t("product.availableSizesTitle");
  const viewCopy = t("product.view");
  const viewAria = t("product.viewAria", { product: { primary: product.name, secondary: product.name } });

  return (
    <motion.article
      layout={!prefersReducedMotion}
      whileHover={prefersReducedMotion ? undefined : { translateY: -4 }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 24 }}
      className="card break-words whitespace-normal break-words whitespace-normal relative flex h-full flex-col gap-3 bg-white/10 p-4"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Build a safe link: disable navigation if product.slug is missing */}
           <Link
             href={product.slug ? `/shop/${product.slug}` : "#"}
             aria-disabled={!product.slug}
             onClick={product.slug ? undefined : (e) => e.preventDefault()}
             className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-white/10">
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-blue-500/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            <span>
              {heroBadge.primary}
              <span className="block text-[9px] font-normal text-white/80">{heroBadge.secondary}</span>
            </span>
          </span>
          {hasSale && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-semibold uppercase text-white">
              <span>{saleBadgeCopy.primary}</span>
              <span className="block text-[9px] font-normal text-white/80">{saleBadgeCopy.secondary}</span>
            </span>
          )}
          <OptimizedImage
            src={displayImage.src}
            alt={displayImage.alt}
            fill
            sizes="(max-width: 768px) 88vw, 280px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority={false}
          />
          <span className="sr-only">{product.name} preview</span>
          {hasMultipleImages && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white">
              {imageIndex + 1}/{product.images.length}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-white/70">
            {product.badges?.includes("official") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                <CheckCircle className="h-3 w-3" aria-hidden />
                <span>
                  {officialCopy.primary}
                  <span className="block text-[10px] text-white/50">{officialCopy.secondary}</span>
                </span>
              </span>
            )}
            {product.badges?.includes("limited") && (
              <span className="chip bg-white/15">
                {t("product.limited").primary}
                <span className="block text-[9px] text-white/60">{t("product.limited").secondary}</span>
              </span>
            )}
            {product.badges?.includes("new") && (
              <span className="chip bg-white/15">
                {t("product.new").primary}
                <span className="block text-[9px] text-white/60">{t("product.new").secondary}</span>
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white">{product.name}</h3>
          <p className="text-xs text-white/70 line-clamp-2">{product.description}</p>
        </div>
      </Link>

      <div className="flex items-center gap-2 text-sm text-white">
        <span className="text-lg font-bold">{formatPrice(lowestPrice)}</span>
        {hasSale && (
          <span className="text-sm text-white/60 line-through">{compareAt ? formatPrice(compareAt) : null}</span>
        )}
        {hasSale && discountPercent && (
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-100">
            {saleBadgeCopy.primary}
            <span className="block text-[9px] text-rose-100/80">{saleBadgeCopy.secondary}</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {colors.map((color) => {
            const colorCopy = t(`color.${color}` as CopyKey);
            const colorAria = t("product.colorwayAria", { color: colorCopy });
            return (
              <span
                key={color}
                className="h-5 w-5 rounded-full border border-white/40"
                style={{ backgroundColor: swatchColor[color] ?? color }}
                role="img"
                aria-label={`${colorAria.primary} / ${colorAria.secondary}`}
              />
            );
          })}
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-white/80 underline min-h-[44px]"
          onClick={toggleSizes}
        >
          {showSizes ? t("product.sizePeek.hide").primary : t("product.sizePeek.show").primary}
          <span className="block text-[10px] text-white/60">
            {showSizes ? t("product.sizePeek.hide").secondary : t("product.sizePeek.show").secondary}
          </span>
        </button>
      </div>

      {showSizes && (
        <div className="rounded-2xl bg-white/10 p-3 text-xs text-white/80">
          <p className="mb-2 font-semibold">
            {availableSizesCopy.primary}
            <span className="block text-[10px] font-normal text-white/60">{availableSizesCopy.secondary}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <span key={size} className="inline-flex h-8 min-w-[44px] items-center justify-center rounded-full bg-white/15 px-3">
                {size}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          className={`btn-primary flex h-12 flex-1 items-center justify-center gap-2 text-sm font-semibold ${
            firstInStock?.stock ? "" : "opacity-60"
          }`}
          onClick={handleAddToCart}
          disabled={!firstInStock?.stock}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {firstInStock?.stock ? t("product.addToCart").primary : t("product.outOfStock").primary}
          <span className="block text-[10px] text-white/60">
            {firstInStock?.stock ? t("product.addToCart").secondary : t("product.outOfStock").secondary}
          </span>
        </button>
        {hasMultipleVariants && (
          <Link
            href={`/shop/${product.slug}`}
            className="btn flex h-12 min-w-[44px] items-center justify-center rounded-xl text-sm"
            aria-label={`${viewAria.primary} / ${viewAria.secondary}`}
          >
            <span>{viewCopy.primary}</span>
            <span className="block text-[10px] text-white/60">{viewCopy.secondary}</span>
          </Link>
        )}
      </div>
    </motion.article>
  );
};

export default ProductCard;

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMUUzQThBIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMzhCREY4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+";
