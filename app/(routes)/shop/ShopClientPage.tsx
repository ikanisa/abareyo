"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import ActiveFilters from "./_components/ActiveFilters";
import HeroShowcase from "./_components/HeroShowcase";
import ProductGrid from "./_components/ProductGrid";
import ProductRail from "./_components/ProductRail";
import ShopHeader from "./_components/ShopHeader";
import TrustBanner from "./_components/TrustBanner";
import ShopOnboarding from "./_components/ShopOnboarding";
import type { FilterSheetProps } from "./_components/FilterSheet";
import type { SortSheetProps } from "./_components/SortSheet";
import { SHOP_TABS, useCart, useCatalog } from "./_logic/useShop";
import { ShopLocaleProvider, useShopLocale, type ShopLocale } from "./_hooks/useShopLocale";

const FilterSheet = dynamic<FilterSheetProps>(
  () => import("./_components/FilterSheet").then((mod) => mod.default),
  { ssr: false },
);
const SortSheet = dynamic<SortSheetProps>(
  () => import("./_components/SortSheet").then((mod) => mod.default),
  { ssr: false },
);

type ShopClientPageProps = { initialLocale?: ShopLocale };

const ShopClientPage = ({ initialLocale }: ShopClientPageProps) => (
  <ShopLocaleProvider initialLocale={initialLocale}>
    <ShopClientPageContent />
  </ShopLocaleProvider>
);

const ShopClientPageContent = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const {
    items,
    isLoading,
    sort,
    setSort,
    searchInput,
    setSearchInput,
    filters,
    activeFilters,
    clearFilter,
    clearAllFilters,
    setCategory,
    toggleSize,
    toggleColor,
    toggleTag,
    setAvailability,
    setPriceRange,
    sections,
    categories,
    activeTabId,
  } = useCatalog();
  const { count: cartCount } = useCart();

  const { hero, topPicks, newArrivals, deals, fanFavorites } = sections;
  const { t } = useShopLocale();
  const shopAllTitle = t("section.shopAll.title");
  const shopAllDescription = t("section.shopAll.description");

  return (
    <>
      <div className="min-h-screen bg-rs-gradient pb-24 text-white">
        <ShopHeader
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onOpenFilters={() => setFiltersOpen(true)}
          onOpenSort={() => setSortOpen(true)}
          tabs={categories}
          activeTabId={activeTabId}
          onSelectTab={(tabId) => {
            const entry = SHOP_TABS.find((tab) => tab.id === tabId);
            setCategory(entry?.category);
          }}
          cartCount={cartCount}
          activeFilters={activeFilters}
        />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-6">
          <HeroShowcase product={hero} />

          <ActiveFilters filters={activeFilters} onClear={clearFilter} onClearAll={clearAllFilters} />

          <ProductRail
            title={t(topPicks.titleKey)}
            caption={t(topPicks.captionKey)}
            items={topPicks.items}
          />
          <ProductRail
            title={t(newArrivals.titleKey)}
            caption={t(newArrivals.captionKey)}
            items={newArrivals.items}
          />
          <ProductRail title={t(deals.titleKey)} caption={t(deals.captionKey)} items={deals.items} />
          <ProductRail
            title={t(fanFavorites.titleKey)}
            caption={t(fanFavorites.captionKey)}
            items={fanFavorites.items}
          />

          <section className="space-y-3">
            <div>
              <h2 className="section-title">
                {shopAllTitle.primary}
                <span className="block text-sm font-normal text-white/70">{shopAllTitle.secondary}</span>
              </h2>
              <p className="text-sm text-white/70">
                {shopAllDescription.primary}
                <span className="block text-xs text-white/60">{shopAllDescription.secondary}</span>
              </p>
            </div>
            <ProductGrid items={items} isLoading={isLoading} />
          </section>

          <TrustBanner />
        </main>

        <FilterSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          categories={categories}
          onSelectCategory={setCategory}
          onToggleSize={toggleSize}
          onToggleColor={toggleColor}
          onToggleTag={toggleTag}
          onAvailabilityChange={setAvailability}
          onPriceRangeChange={setPriceRange}
          onClearAll={clearAllFilters}
        />
        <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onSelect={setSort} />
      </div>
      <ShopOnboarding />
    </>
  );
};

export default ShopClientPage;
