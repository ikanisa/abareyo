"use client";

import { useMemo } from "react";

import useShopLocale from "../_hooks/useShopLocale";
import type { Filters } from "../_logic/useShop";
import { ALL_CATEGORIES } from "../_data/products";

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (next: Filters) => void;
};

const FilterSheet = ({ open, onClose, filters, onChange }: FilterSheetProps) => {
  const strings = useShopLocale();
  const categoryOptions = useMemo(() => ["all", ...ALL_CATEGORIES] as const, []);

  if (!open) return null;

  const toggleSize = (size: string) => {
    const set = new Set(filters.sizes ?? []);
    set.has(size as never) ? set.delete(size as never) : set.add(size as never);
    onChange({ ...filters, sizes: Array.from(set) });
  };

  const toggleColor = (color: string) => {
    const set = new Set(filters.colors ?? []);
    set.has(color as never) ? set.delete(color as never) : set.add(color as never);
    onChange({ ...filters, colors: Array.from(set) });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="card w-full space-y-4 bg-slate-900 p-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{strings.filters}</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80">Category</h3>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                className={`btn ${filters.category === category ? "bg-white text-slate-900" : ""}`}
                onClick={() => onChange({ ...filters, category })}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80">{strings.size}</h3>
          <div className="flex flex-wrap gap-2">
            {(["XS", "S", "M", "L", "XL", "XXL"] as const).map((size) => {
              const selected = (filters.sizes ?? []).includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  className={`btn ${selected ? "bg-white text-slate-900" : ""}`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80">{strings.color}</h3>
          <div className="flex flex-wrap gap-2">
            {(["blue", "white", "black"] as const).map((color) => {
              const selected = (filters.colors ?? []).includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  className={`btn ${selected ? "bg-white text-slate-900" : ""}`}
                  onClick={() => toggleColor(color)}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80">{strings.price}</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.min ?? ""}
              placeholder="Min"
              onChange={(event) =>
                onChange({
                  ...filters,
                  min: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <input
              type="number"
              value={filters.max ?? ""}
              placeholder="Max"
              onChange={(event) =>
                onChange({
                  ...filters,
                  max: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </section>

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(event) => onChange({ ...filters, inStock: event.target.checked })}
          />
          In stock only
        </label>
      </div>
    </div>
  );
};

export type { FilterSheetProps };
export default FilterSheet;
