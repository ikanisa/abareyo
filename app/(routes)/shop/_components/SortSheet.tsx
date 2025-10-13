"use client";

import useShopLocale from "../_hooks/useShopLocale";
import type { Sort } from "../_logic/useShop";

type SortSheetProps = {
  open: boolean;
  onClose: () => void;
  sort: Sort;
  onChange: (next: Sort) => void;
};

const options: { value: Sort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
];

const SortSheet = ({ open, onClose, sort, onChange }: SortSheetProps) => {
  const strings = useShopLocale();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="card w-full space-y-4 bg-slate-900 p-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{strings.sort}</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`btn w-full justify-start ${option.value === sort ? "bg-white text-slate-900" : ""}`}
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export type { SortSheetProps };
export default SortSheet;
