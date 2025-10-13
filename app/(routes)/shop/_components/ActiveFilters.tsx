"use client";

import useShopLocale from "../_hooks/useShopLocale";
import type { Filters } from "../_logic/useShop";

type ActiveFiltersProps = {
  filters: Filters;
  onChange: (next: Filters) => void;
};

const chipClass = "tile inline-flex items-center gap-2 text-xs";

const ActiveFilters = ({ filters, onChange }: ActiveFiltersProps) => {
  const strings = useShopLocale();
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.category && filters.category !== "all") {
    chips.push({
      label: filters.category,
      onRemove: () => onChange({ ...filters, category: "all" }),
    });
  }

  (filters.sizes ?? []).forEach((size) =>
    chips.push({
      label: `${strings.size} ${size}`,
      onRemove: () =>
        onChange({
          ...filters,
          sizes: (filters.sizes ?? []).filter((entry) => entry !== size),
        }),
    }),
  );

  (filters.colors ?? []).forEach((color) =>
    chips.push({
      label: `${strings.color} ${color}`,
      onRemove: () =>
        onChange({
          ...filters,
          colors: (filters.colors ?? []).filter((entry) => entry !== color),
        }),
    }),
  );

  if (typeof filters.min === "number" || typeof filters.max === "number") {
    const min = typeof filters.min === "number" ? filters.min : undefined;
    const max = typeof filters.max === "number" ? filters.max : undefined;
    const copy = [min ? `≥ ${min}` : null, max ? `≤ ${max}` : null].filter(Boolean).join(" · ");
    chips.push({
      label: `${strings.price} ${copy}`.trim(),
      onRemove: () => onChange({ ...filters, min: undefined, max: undefined }),
    });
  }

  if (filters.inStock) {
    chips.push({
      label: "In stock",
      onRemove: () => onChange({ ...filters, inStock: false }),
    });
  }

  if (!chips.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button key={chip.label} type="button" className={chipClass} onClick={chip.onRemove}>
          <span>{chip.label}</span>
          <span aria-hidden>×</span>
        </button>
      ))}
      <button
        type="button"
        className="btn"
        onClick={() => onChange({ category: "all", sizes: [], colors: [], inStock: false, min: undefined, max: undefined })}
      >
        Clear
      </button>
    </div>
  );
};

export default ActiveFilters;
