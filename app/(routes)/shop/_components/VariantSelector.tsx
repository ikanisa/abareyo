"use client";

import type { Product, Variant } from "../_data/products";
import { useShopLocale, type CopyKey } from "../_hooks/useShopLocale";

const swatchColor: Record<string, string> = {
  blue: "#0033FF",
  white: "#FFFFFF",
  black: "#000000",
};

type VariantSelectorProps = {
  product: Product;
  value: Variant;
  onChange: (variant: Variant) => void;
};

const VariantSelector = ({ product, value, onChange }: VariantSelectorProps) => {
  const { t } = useShopLocale();
  const colors = Array.from(new Set(product.variants.map((variant) => variant.color)));
  const sizesForColor = (color: Variant["color"]) =>
    product.variants.filter((variant) => variant.color === color).map((variant) => variant.size);
  const currentSizes = sizesForColor(value.color);
  const colorLabel = t("variant.color");
  const sizeLabel = t("variant.size");
  const skuCopy = t("variant.sku");
  const stockCopy =
    value.stock > 5
      ? t("variant.stockReady")
      : value.stock > 0
        ? t("variant.stockLow", { count: value.stock })
        : t("variant.stockOut");

  const selectColor = (color: Variant["color"]) => {
    const preferred = product.variants.find((variant) => variant.color === color && variant.size === value.size);
    const fallback = product.variants.find((variant) => variant.color === color);
    if (preferred) onChange(preferred);
    else if (fallback) onChange(fallback);
  };

  const selectSize = (size: Variant["size"]) => {
    const match = product.variants.find((variant) => variant.color === value.color && variant.size === size);
    if (match) onChange(match);
  };

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/80">
          {colorLabel.primary}
          <span className="block text-[11px] text-white/60">{colorLabel.secondary}</span>
        </h3>
        <div className="flex gap-2">
          {colors.map((color) => {
            const isActive = color === value.color;
            const labelCopy = t(`color.${color}` as CopyKey);
            return (
              <button
                key={color}
                type="button"
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-medium ${
                  isActive ? "border-white bg-white/20" : "border-white/20 bg-white/10"
                }`}
                onClick={() => selectColor(color)}
                aria-pressed={isActive}
              >
                <span
                  className="h-5 w-5 rounded-full border border-white/50"
                  style={{ backgroundColor: swatchColor[color] ?? color }}
                  aria-hidden
                />
                <span>
                  {labelCopy.primary}
                  <span className="block text-[10px] text-white/60">{labelCopy.secondary}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/80">
          {sizeLabel.primary}
          <span className="block text-[11px] text-white/60">{sizeLabel.secondary}</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {currentSizes.map((size) => {
            const isActive = size === value.size;
            const variant = product.variants.find((entry) => entry.color === value.color && entry.size === size);
            const outOfStock = !variant || variant.stock === 0;
            return (
              <button
                key={size}
                type="button"
                className={`h-12 rounded-2xl border text-sm font-semibold ${
                  isActive ? "border-white bg-white/20" : "border-white/20 bg-white/10"
                } ${outOfStock ? "opacity-50" : ""}`}
                onClick={() => selectSize(size)}
                aria-pressed={isActive}
                disabled={outOfStock}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-white/70">
        {skuCopy.primary}: {value.sku}
        <span className="block text-[10px] text-white/60">{skuCopy.secondary}: {value.sku}</span>
        <span className="mt-1 block text-[10px] text-white/60">
          {stockCopy.primary}
          <span className="block text-[9px] text-white/50">{stockCopy.secondary}</span>
        </span>
      </p>
    </section>
  );
};

export default VariantSelector;
