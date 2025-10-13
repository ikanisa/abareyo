"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { formatPrice, minPrice } from "../_logic/useShop";
import type { Product } from "../_data/products";
import { useShopLocale } from "../_hooks/useShopLocale";

type HeroShowcaseProps = {
  product: Product;
};

const HeroShowcase = ({ product }: HeroShowcaseProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroImage = product.images[0] ?? DEFAULT_FALLBACK_IMAGE;
  const { t, translateField, selectField } = useShopLocale();
  const limitedCopy = t("hero.limitedTag");
  const nameCopy = translateField(product.name);
  const heroCopy = product.heroCopy ? translateField(product.heroCopy) : null;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.4 }}
      className="card relative overflow-hidden bg-white/10 p-5 text-white"
    >
      <div className="absolute inset-0 -z-10 opacity-40" aria-hidden>
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-500/60 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-yellow-400/40 blur-3xl" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white/10">
          {!imageLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/10 via-white/20 to-white/10"
              aria-hidden
            />
          )}
          <Image
            src={heroImage.src}
            alt={selectField(heroImage.alt)}
            fill
            sizes="(max-width: 768px) 88vw, 560px"
            className={`object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/80">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span>
              {t("hero.badge").primary}
              <span className="block text-[10px] font-normal uppercase tracking-[0.2em] text-white/60">
                {t("hero.badge").secondary}
              </span>
            </span>
          </span>
          <h2 className="text-2xl font-bold leading-tight">
            {nameCopy.primary}
            <span className="block text-sm font-normal text-white/70">{nameCopy.secondary}</span>
          </h2>
          {heroCopy && (
            <p className="text-sm text-white/80">
              {heroCopy.primary}
              <span className="block text-xs text-white/60">{heroCopy.secondary}</span>
            </p>
          )}
          <div className="flex items-center gap-2 text-lg font-semibold">
            {formatPrice(minPrice(product))}
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs uppercase tracking-wide text-white/80">
              {limitedCopy.primary}
              <span className="block text-[10px] font-normal text-white/60">{limitedCopy.secondary}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t("hero.trustOne").primary}
              <span className="block text-[10px] text-white/60">{t("hero.trustOne").secondary}</span>
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t("hero.trustTwo").primary}
              <span className="block text-[10px] text-white/60">{t("hero.trustTwo").secondary}</span>
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t("hero.trustThree").primary}
              <span className="block text-[10px] text-white/60">{t("hero.trustThree").secondary}</span>
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Link href={`/shop/${product.slug}`} className="btn-primary flex-1 text-center text-sm font-semibold">
              {t("hero.ctaPrimary").primary}
              <span className="block text-xs font-normal text-white/70">{t("hero.ctaPrimary").secondary}</span>
            </Link>
            <Link href="/cart" className="btn flex-1 text-center text-sm font-semibold">
              {t("hero.ctaSecondary").primary}
              <span className="block text-xs font-normal text-white/70">{t("hero.ctaSecondary").secondary}</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroShowcase;

const DEFAULT_FALLBACK_IMAGE = {
  src: "/placeholder.svg",
  alt: {
    en: "Featured product",
    rw: "Igicuruzwa cyagaragajwe",
  },
};

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMUUzQThBIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMzhCREY4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+";
