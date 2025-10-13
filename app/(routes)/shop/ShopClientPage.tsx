"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { SectionHeader } from "@/app/_components/widgets/SectionHeader";
import { WidgetRow } from "@/app/_components/widgets/WidgetRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import ActiveFilters, { formatActiveFilterCopy } from "./_components/ActiveFilters";
import HeroShowcase from "./_components/HeroShowcase";
import ProductGrid from "./_components/ProductGrid";
import ProductRail from "./_components/ProductRail";
import TrustBanner from "./_components/TrustBanner";
import ShopOnboarding from "./_components/ShopOnboarding";
// Pull prop types explicitly so that dynamic imports retain type safety.
import type { FilterSheetProps } from "./_components/FilterSheet";
import type { SortSheetProps } from "./_components/SortSheet";
import { SHOP_TABS, useCart, useCatalog } from "./_logic/useShop";
import { ShopLocaleProvider, useShopLocale, type ShopLocale } from "./_hooks/useShopLocale";

// Provide explicit generic types for the dynamic imports.  Without this, type inference
// falls back to `any` and prop hints are lost.
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
  const { t, locale, setLocale } = useShopLocale();
  const shopAllTitle = t("section.shopAll.title");
  const shopAllDescription = t("section.shopAll.description");
  const tagline = t("header.tagline");
  const heroTitle = t("header.title");
  const summaryCopy = t("header.summary");
  const searchPlaceholder = t("header.searchPlaceholder");
  const sortCopy = t("header.sort");
  const filterCopy = t("header.filter");
  const localeToggleCopy = t("header.localeToggle");
  const clearCopy = t("chip.clear");

  const filterSummary = useMemo(() => {
    if (!activeFilters.length) {
      return null;
    }
    const formatted = formatActiveFilterCopy(activeFilters[0], t);
    const remainder = activeFilters.length > 1 ? ` +${activeFilters.length - 1}` : "";
    return {
      primary: `${formatted.primary}${remainder}`,
      secondary: `${formatted.secondary}${remainder}`,
    };
  }, [activeFilters, t]);

  const handleSelectTab = (tabId: string) => {
    const entry = SHOP_TABS.find((tab) => tab.id === tabId);
    setCategory(entry?.category);
  };

  const heroSubtitle = `${tagline.primary} · ${summaryCopy.primary}`;
  const heroSubtitleSecondary = `${tagline.secondary} · ${summaryCopy.secondary}`;
  const localeLabel = locale === "en" ? "EN · RW" : "RW · EN";
  const cartActionLabel = cartCount > 0 ? `Cart (${cartCount})` : "Cart";

  const heroCtas = (
    <>
      <Button variant="hero" onClick={() => setFiltersOpen(true)}>
        {filterCopy.primary}
      </Button>
      <Link className="btn" href="/cart" aria-label={cartCount ? `View cart (${cartCount})` : "View cart"}>
        {cartActionLabel}
      </Link>
    </>
  );

  const topBarActions = (
    <>
      <Button
        variant="glass"
        onClick={() => setLocale(locale === "en" ? "rw" : "en")}
      >
        {localeLabel}
        <span className="sr-only">{`${localeToggleCopy.primary} / ${localeToggleCopy.secondary}`}</span>
      </Button>
      <Button variant="glass" onClick={() => setFiltersOpen(true)}>
        {filterCopy.primary}
      </Button>
      <Link className="btn" href="/cart" aria-label={cartCount ? `View cart (${cartCount})` : "View cart"}>
        {cartActionLabel}
      </Link>
    </>
  );

  return (
    <>
      <PageShell mainClassName="space-y-6 pb-32 pt-4 max-w-xl">
        <TopAppBar right={topBarActions} />
        <HeroBlock
          title={heroTitle.primary}
          subtitle={`${heroSubtitle} / ${heroSubtitleSecondary}`}
          ctas={heroCtas}
        />

        <section className="space-y-3">
          <SectionHeader
            title="Find your gear"
            action={
              activeFilters.length ? (
                <Button variant="glass" onClick={clearAllFilters}>
                  {clearCopy.primary}
                </Button>
              ) : null
            }
          />
          <div className="card space-y-4 p-5">
            <p className="text-sm text-white/80">
              {tagline.primary}
              <span className="block text-xs text-white/60">{tagline.secondary}</span>
            </p>
            <label
              className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-white/90"
              htmlFor="shop-search"
            >
              <Search className="h-4 w-4 text-white/70" aria-hidden />
              <input
                id="shop-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={`${searchPlaceholder.primary} / ${searchPlaceholder.secondary}`}
                className="h-11 flex-1 border-none bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" onClick={() => setFiltersOpen(true)}>
                {filterCopy.primary}
              </Button>
              <Button variant="glass" onClick={() => setSortOpen(true)}>
                {sortCopy.primary}
              </Button>
              <Button variant="glass" onClick={() => setLocale(locale === "en" ? "rw" : "en")}>
                {localeLabel}
                <span className="sr-only">{`${localeToggleCopy.primary} / ${localeToggleCopy.secondary}`}</span>
              </Button>
            </div>
            {filterSummary ? (
              <div className="text-sm text-white/80">
                {filterSummary.primary}
                <span className="block text-xs text-white/60">{filterSummary.secondary}</span>
              </div>
            ) : (
              <div className="text-sm text-white/70">
                {summaryCopy.primary}
                <span className="block text-xs text-white/60">{summaryCopy.secondary}</span>
              </div>
            )}
          </div>
          {activeFilters.length ? (
            <div className="card p-4">
              <ActiveFilters filters={activeFilters} onClear={clearFilter} onClearAll={clearAllFilters} />
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <SectionHeader title="Shop by category" />
          <WidgetRow>
            {categories.map((tab) => {
              const isActive = tab.id === activeTabId;
              const labelCopy = t(tab.labelKey);
              const descriptionCopy = t(tab.descriptionKey);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={cn(
                    "tile min-w-[160px] flex-col items-start text-left",
                    isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/70 hover:bg-white/20",
                  )}
                  aria-pressed={isActive}
                >
                  <span className="text-base font-semibold text-white">{labelCopy.primary}</span>
                  <span className="text-xs text-white/70">{labelCopy.secondary}</span>
                  <span className="text-[11px] text-white/60">
                    {tab.count} • {descriptionCopy.primary}
                  </span>
                </button>
              );
            })}
          </WidgetRow>
        </section>

        <HeroShowcase product={hero} />

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
      </PageShell>

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
      <ShopOnboarding />
    </>
  );
};

export default ShopClientPage;
