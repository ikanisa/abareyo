"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Languages, Search, SlidersHorizontal, ShoppingCart, User } from "lucide-react";
import { useMemo } from "react";

import type { ActiveFilter, ShopTab } from "../_logic/useShop";
import { useShopLocale } from "../_hooks/useShopLocale";
import { formatActiveFilterCopy } from "./ActiveFilters";

export type ShopHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  onOpenSort: () => void;
  tabs: {
    id: string;
    labelKey: ShopTab["labelKey"];
    descriptionKey: ShopTab["descriptionKey"];
    category?: ShopTab["category"];
    count: number;
  }[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  cartCount: number;
  activeFilters: ActiveFilter[];
};

const tabWidth = 96;

const ShopHeader = ({
  searchValue,
  onSearchChange,
  onOpenFilters,
  onOpenSort,
  tabs,
  activeTabId,
  onSelectTab,
  cartCount,
  activeFilters,
}: ShopHeaderProps) => {
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTabId));
  const indicatorX = activeIndex * tabWidth;
  const { locale, setLocale, t } = useShopLocale();

  const searchPlaceholder = t("header.searchPlaceholder");
  const sortLabel = t("header.sort");
  const tagline = t("header.tagline");
  const title = t("header.title");
  const summaryCopy = t("header.summary");
  const filterSummary = useMemo(() => {
    if (!activeFilters.length) return null;
    const formatted = formatActiveFilterCopy(activeFilters[0], t);
    const remainder = activeFilters.length > 1 ? ` +${activeFilters.length - 1}` : "";
    return {
      primary: `${formatted.primary}${remainder}`,
      secondary: `${formatted.secondary}${remainder}`,
    };
  }, [activeFilters, t]);
  const filterLabel = t("header.filter");
  const localeLabel = locale === "en" ? "EN" : "RW";
  const localeAlternate = locale === "en" ? "RW" : "EN";

  return (
    <header className="sticky top-0 z-30 bg-rs-gradient/95 backdrop-blur-lg pb-3 pt-safe">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4">
        <div className="flex items-center justify-between gap-2 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">
              {tagline.primary}
              <span className="block text-white/50 normal-case">{tagline.secondary}</span>
            </p>
            <h1 className="text-2xl font-bold text-white">
              {title.primary}
              <span className="block text-sm font-normal text-white/70">{title.secondary}</span>
            </h1>
            <p className="text-xs text-white/60">
              {(filterSummary ?? summaryCopy).primary}
              <span className="block text-white/50">{(filterSummary ?? summaryCopy).secondary}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn flex h-11 min-w-[44px] items-center justify-center rounded-xl"
              onClick={onOpenFilters}
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
              <span className="sr-only">{`${filterLabel.primary} / ${filterLabel.secondary}`}</span>
            </button>
            <Link
              href="/cart"
              className="btn relative flex h-11 min-w-[44px] items-center justify-center rounded-xl"
              aria-label={cartCount ? `View cart (${cartCount})` : "View cart"}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/more"
              className="btn flex h-11 min-w-[44px] items-center justify-center rounded-xl"
              aria-label="Profile & settings"
            >
              <User className="h-5 w-5" aria-hidden />
            </Link>
            <button
              type="button"
              className="btn flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl"
              onClick={() => setLocale(locale === "en" ? "rw" : "en")}
            >
              <Languages className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold">
                {localeLabel} · {localeAlternate}
              </span>
              <span className="sr-only">{`${t("header.localeToggle").primary} / ${t("header.localeToggle").secondary}`}</span>
            </button>
          </div>
        </div>

        <label className="relative flex items-center overflow-hidden rounded-2xl bg-white/15 pr-3" htmlFor="shop-search">
          <span className="pl-3 text-white/70">
            <Search className="h-4 w-4" aria-hidden />
          </span>
          <input
            id="shop-search"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`${searchPlaceholder.primary} / ${searchPlaceholder.secondary}`}
            className="h-11 flex-1 border-none bg-transparent px-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
            aria-label={`${searchPlaceholder.primary} / ${searchPlaceholder.secondary}`}
          />
          <button
            type="button"
            className="btn ml-2 flex h-11 min-h-[44px] items-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-semibold text-white hover:bg-white/25"
            onClick={onOpenSort}
          >
            <span>{sortLabel.primary}</span>
            <span className="text-xs text-white/60">{sortLabel.secondary}</span>
          </button>
        </label>

        <div className="relative">
          <nav className="h-scroll flex gap-2 pb-1" aria-label="Shop tabs">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const labelCopy = t(tab.labelKey);
              const descriptionCopy = t(tab.descriptionKey);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex h-11 min-w-[96px] flex-col items-start justify-center rounded-2xl px-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="text-sm font-semibold leading-tight">
                    {labelCopy.primary}
                    <span className="block text-[11px] font-normal text-white/60">{labelCopy.secondary}</span>
                  </span>
                  <span className="text-[11px] text-white/60 leading-tight">
                    {tab.count} • {descriptionCopy.primary}
                    <span className="block text-[10px] text-white/50">{descriptionCopy.secondary}</span>
                  </span>
                </button>
              );
            })}
          </nav>
          <motion.span
            className="absolute left-0 top-full mt-1 hidden h-[3px] rounded-full bg-white md:block"
            style={{ width: tabWidth }}
            initial={false}
            animate={{ x: indicatorX }}
            transition={{ type: prefersReducedMotion ? "tween" : "spring", stiffness: 220, damping: 26 }}
          />
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
