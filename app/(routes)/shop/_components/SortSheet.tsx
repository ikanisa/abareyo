"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";

import type { SortOption } from "../_logic/useShop";
import useDialogFocusTrap from "../_hooks/useDialogFocusTrap";
import { useShopLocale } from "../_hooks/useShopLocale";

export type SortSheetProps = {
  open: boolean;
  onClose: () => void;
  value: SortOption;
  onSelect: (value: SortOption) => void;
};

const SortSheet = ({ open, onClose, value, onSelect }: SortSheetProps) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useDialogFocusTrap<HTMLDivElement>(open, { onClose });
  const { t } = useShopLocale();
  const options: { id: SortOption; label: string; description: string }[] = [
    { id: "recommended", label: t("sort.recommended").primary, description: t("sort.recommended").secondary },
    { id: "price-asc", label: t("sort.priceAsc").primary, description: t("sort.priceAsc").secondary },
    { id: "price-desc", label: t("sort.priceDesc").primary, description: t("sort.priceDesc").secondary },
    { id: "newest", label: t("sort.newest").primary, description: t("sort.newest").secondary },
    { id: "popular", label: t("sort.popular").primary, description: t("sort.popular").secondary },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sort-title"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label={`${t("sort.title").primary} / ${t("sort.title").secondary}`}
            onClick={onClose}
          />
          <motion.div
            ref={containerRef}
            className="card break-words whitespace-normal relative w-full max-w-md rounded-t-3xl bg-[#0f1b4c] text-white shadow-2xl"
            initial={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            transition={{ type: prefersReducedMotion ? "tween" : "spring", stiffness: 240, damping: 28 }}
          >
            <div className="flex items-center justify-between pb-2">
              <h2 id="sort-title" className="text-lg font-semibold">
                {t("sort.title").primary}
                <span className="block text-sm font-normal text-white/70">{t("sort.title").secondary}</span>
              </h2>
              <button
                type="button"
                className="btn flex h-11 w-11 items-center justify-center rounded-full"
                onClick={onClose}
                aria-label={`${t("sort.title").primary} / ${t("sort.title").secondary}`}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-2">
              {options.map((option) => {
                const isActive = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-left transition min-h-[56px] ${
                      isActive ? "border-white/40 bg-white/20" : "hover:border-white/20"
                    }`}
                    onClick={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    aria-pressed={isActive}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-white/70">{option.description}</span>
                    </span>
                    {isActive && <Check className="h-5 w-5" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SortSheet;
