"use client";

import type { ActiveFilter } from "../_logic/useShop";
import { formatPrice, SHOP_TABS } from "../_logic/useShop";
import { useShopLocale, type BilingualString, type CopyKey } from "../_hooks/useShopLocale";

type ActiveFiltersProps = {
  filters: ActiveFilter[];
  onClear: (key: string, value?: string) => void;
  onClearAll: () => void;
};

type Translator = ReturnType<typeof useShopLocale>["t"];

export const formatActiveFilterCopy = (filter: ActiveFilter, t: Translator): BilingualString => {
  const fallbackLabel = filter.label;
  if (filter.kind === "category") {
    const tab = SHOP_TABS.find((entry) => entry.category === filter.value);
    const valueCopy = tab ? t(tab.labelKey) : { primary: filter.value, secondary: filter.value };
    return t("chip.category", { value: valueCopy });
  }

  if (filter.kind === "size") {
    return t("chip.size", { value: filter.value });
  }

  if (filter.kind === "color") {
    const colorKey = `color.${filter.value}` as CopyKey;
    const colorCopy = t(colorKey);
    return t("chip.color", { value: colorCopy });
  }

  if (filter.kind === "tag") {
    const tagKey = `tag.${filter.value}` as CopyKey;
    const tagCopy = t(tagKey);
    return t("chip.tag", { value: tagCopy });
  }

  if (filter.kind === "price") {
    const english: string[] = [];
    const kinyarwanda: string[] = [];
    if (filter.min != null) {
      const value = formatPrice(filter.min);
      english.push(`from ${value}`);
      kinyarwanda.push(`uva kuri ${value}`);
    }
    if (filter.max != null) {
      const value = formatPrice(filter.max);
      english.push(`to ${value}`);
      kinyarwanda.push(`ugeza kuri ${value}`);
    }
    return {
      primary: [`Price`, ...english].join(" ").trim(),
      secondary: [`Igiciro`, ...kinyarwanda].join(" ").trim(),
    };
  }

  if (filter.kind === "stock") {
    return t("chip.stock");
  }

  if (filter.kind === "search") {
    return t("chip.search", { query: filter.value });
  }

  return { primary: fallbackLabel, secondary: fallbackLabel };
};

const ActiveFilters = ({ filters, onClear, onClearAll }: ActiveFiltersProps) => {
  const { t } = useShopLocale();
  if (!filters.length) return null;
  const clearCopy = t("chip.clear");
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const label = formatActiveFilterCopy(filter, t);
        return (
          <button
            key={`${filter.key}-${"value" in filter ? filter.value ?? "all" : filter.key}`}
            type="button"
            onClick={() => onClear(filter.key, "value" in filter ? (filter as { value?: string }).value : undefined)}
            className="chip flex min-h-[44px] items-center gap-2 bg-white/20 px-4 pr-3 text-left"
          >
            <span>
              {label.primary}
              <span className="block text-[11px] text-white/70">{label.secondary}</span>
            </span>
            <span aria-hidden>×</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onClearAll}
        className="chip min-h-[44px] bg-white/10 px-4 text-white/70 hover:bg-white/20 text-left"
      >
        {clearCopy.primary}
        <span className="block text-[11px] text-white/60">{clearCopy.secondary}</span>
      </button>
    </div>
  );
};

export default ActiveFilters;
