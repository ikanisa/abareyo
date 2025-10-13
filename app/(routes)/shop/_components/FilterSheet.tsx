"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import type { Product } from "../_data/products";
import type { FilterState, ShopTab } from "../_logic/useShop";
import useDialogFocusTrap from "../_hooks/useDialogFocusTrap";
import { useShopLocale, type CopyKey } from "../_hooks/useShopLocale";

const sizeOptions: FilterState["sizes"] = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions: FilterState["colors"] = ["blue", "white", "black"];
const tagOptions: FilterState["tags"] = ["Official", "Replica", "Kids"];

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  categories: {
    id: string;
    labelKey: ShopTab["labelKey"];
    descriptionKey: ShopTab["descriptionKey"];
    category?: Product["category"];
    count: number;
  }[];
  onSelectCategory: (category?: Product["category"]) => void;
  onToggleSize: (size: FilterState["sizes"][number]) => void;
  onToggleColor: (color: FilterState["colors"][number]) => void;
  onToggleTag: (tag: FilterState["tags"][number]) => void;
  onAvailabilityChange: (value: boolean) => void;
  onPriceRangeChange: (min?: number, max?: number) => void;
  onClearAll: () => void;
};

const FilterSheet = ({
  open,
  onClose,
  filters,
  categories,
  onSelectCategory,
  onToggleSize,
  onToggleColor,
  onToggleTag,
  onAvailabilityChange,
  onPriceRangeChange,
  onClearAll,
}: FilterSheetProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [min, setMin] = useState<string>(filters.min ? String(filters.min) : "");
  const [max, setMax] = useState<string>(filters.max ? String(filters.max) : "");
  const containerRef = useDialogFocusTrap<HTMLDivElement>(open, { onClose });
  const { t } = useShopLocale();

  useEffect(() => {
    if (!open) return;
    setMin(filters.min ? String(filters.min) : "");
    setMax(filters.max ? String(filters.max) : "");
  }, [filters.max, filters.min, open]);

  const applyPriceRange = () => {
    const minValue = min ? Number(min) : undefined;
    const maxValue = max ? Number(max) : undefined;
    onPriceRangeChange(
      Number.isFinite(minValue ?? NaN) ? minValue : undefined,
      Number.isFinite(maxValue ?? NaN) ? maxValue : undefined,
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filters-title"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label={`${t("filter.title").primary} / ${t("filter.title").secondary}`}
            onClick={onClose}
          />
          <motion.div
            ref={containerRef}
            className="card relative w-full max-w-md rounded-t-3xl bg-[#0f1b4c] text-white shadow-2xl"
            initial={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            transition={{ type: prefersReducedMotion ? "tween" : "spring", stiffness: 250, damping: 30 }}
          >
            <div className="flex items-center justify-between pb-2">
              <h2 id="filters-title" className="text-lg font-semibold">
                {t("filter.title").primary}
                <span className="block text-sm font-normal text-white/70">{t("filter.title").secondary}</span>
              </h2>
              <button
                type="button"
                className="btn flex h-11 w-11 items-center justify-center rounded-full"
                onClick={onClose}
                aria-label={`${t("filter.title").primary} / ${t("filter.title").secondary}`}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-6 overflow-y-auto pb-4">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                  {t("filter.category").primary}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const isActive = filters.category === category.category;
                    const labelCopy = t(category.labelKey);
                    const descriptionCopy = t(category.descriptionKey);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`tile flex min-h-[52px] flex-col items-start gap-0 rounded-2xl px-3 py-2 text-left ${
                          isActive ? "bg-white/30" : "bg-white/10"
                        }`}
                        onClick={() => onSelectCategory(category.category)}
                        aria-pressed={isActive}
                      >
                        <span className="text-sm font-semibold leading-tight">
                          {labelCopy.primary}
                          <span className="block text-[11px] font-normal text-white/70">{labelCopy.secondary}</span>
                        </span>
                        <span className="text-[11px] text-white/70 leading-tight">
                          {category.count} • {descriptionCopy.primary}
                          <span className="block text-[10px] text-white/50">{descriptionCopy.secondary}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                  {t("filter.size").primary}
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {sizeOptions.map((size) => {
                    const isActive = filters.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`tile flex h-12 min-h-[48px] items-center justify-center rounded-2xl text-sm font-semibold ${
                          isActive ? "bg-white/30" : "bg-white/10"
                        }`}
                        onClick={() => onToggleSize(size)}
                        aria-pressed={isActive}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                  {t("filter.color").primary}
                </h3>
                <div className="mt-3 flex gap-3">
                  {colorOptions.map((color) => {
                    const isActive = filters.colors.includes(color);
                    const colorCopy = t(`color.${color}` as CopyKey);
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`tile flex h-12 min-h-[48px] flex-1 items-center justify-start gap-3 rounded-2xl px-3 text-sm ${
                          isActive ? "bg-white/30" : "bg-white/10"
                        }`}
                        onClick={() => onToggleColor(color)}
                        aria-pressed={isActive}
                      >
                        <span
                          className="h-5 w-5 rounded-full border border-white/30"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                        <span className="leading-tight text-left">
                          {colorCopy.primary}
                          <span className="block text-[11px] text-white/70">{colorCopy.secondary}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                  {t("filter.tags").primary}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagOptions.map((tag) => {
                    const isActive = filters.tags.includes(tag);
                    const tagCopy = t(`tag.${tag}` as CopyKey);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`chip min-h-[44px] rounded-full px-4 text-sm font-medium text-left ${
                          isActive ? "bg-white/30" : "bg-white/15"
                        }`}
                        onClick={() => onToggleTag(tag)}
                        aria-pressed={isActive}
                      >
                        <span>
                          {tagCopy.primary}
                          <span className="block text-[11px] text-white/70">{tagCopy.secondary}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                  {t("filter.price").primary}
                  <span className="block text-xs text-white/60">{t("filter.price").secondary}</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col text-xs text-white/70">
                    {t("filter.min").primary}
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={min}
                      onChange={(event) => setMin(event.target.value.replace(/[^0-9]/g, ""))}
                      onBlur={applyPriceRange}
                      className="mt-1 h-11 rounded-2xl bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                    />
                  </label>
                  <label className="flex flex-col text-xs text-white/70">
                    {t("filter.max").primary}
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={max}
                      onChange={(event) => setMax(event.target.value.replace(/[^0-9]/g, ""))}
                      onBlur={applyPriceRange}
                      className="mt-1 h-11 rounded-2xl bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{t("filter.inStock").primary}</span>
                  <button
                    type="button"
                    onClick={() => onAvailabilityChange(!filters.inStock)}
                    className={`flex h-11 min-w-[88px] items-center justify-center rounded-full border border-white/30 px-4 text-sm font-semibold ${
                      filters.inStock ? "bg-blue-500 text-white" : "bg-white/10"
                    }`}
                    aria-pressed={filters.inStock}
                  >
                    {filters.inStock ? t("filter.on").primary : t("filter.off").primary}
                  </button>
                </div>
              </section>
            </div>
            <div className="flex items-center justify-between border-t border-white/15 pt-3">
              <button type="button" className="btn min-h-[44px]" onClick={onClearAll}>
                {t("filter.clear").primary}
              </button>
              <button
                type="button"
                className="btn-primary min-h-[44px] px-6"
                onClick={() => {
                  applyPriceRange();
                  onClose();
                }}
              >
                {t("filter.done").primary}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FilterSheet;
