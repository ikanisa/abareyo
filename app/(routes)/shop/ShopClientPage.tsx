"use client";

import { useMemo, useState } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";

import ActiveFilters from "./_components/ActiveFilters";
import FilterSheet from "./_components/FilterSheet";
import HeroShowcase from "./_components/HeroShowcase";
import ProductCard from "./_components/ProductCard";
import ProductRail from "./_components/ProductRail";
import ShopOnboarding from "./_components/ShopOnboarding";
import SortSheet from "./_components/SortSheet";
import useShopLocale from "./_hooks/useShopLocale";
import { useCatalog } from "./_logic/useShop";

const ShopClientPage = () => {
  const strings = useShopLocale();
  const { list, filters, setFilters, sort, setSort, featured, all } = useCatalog();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const recommendations = useMemo(() => all.filter((product) => product.badges?.includes("official")), [all]);

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar
        right={
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => setFiltersOpen(true)}>
              {strings.filters}
            </button>
            <button type="button" className="btn" onClick={() => setSortOpen(true)}>
              {strings.sort}
            </button>
          </div>
        }
      />

      {featured ? <HeroShowcase product={featured} /> : null}
      <ShopOnboarding />

      <section className="space-y-3">
        <h2 className="section-title">Shop all</h2>
        <ActiveFilters filters={filters} onChange={setFilters} />
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <ProductRail title="Recommended" products={recommendations.slice(0, 5)} />

      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} onChange={setFilters} />
      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} sort={sort} onChange={setSort} />
    </PageShell>
  );
};

export default ShopClientPage;
