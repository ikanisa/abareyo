"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";

import { track } from "@/lib/track";

const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"] as const;

type VariantSummary = {
  size: string;
  stock: number;
};

type ProductPurchaseProps = {
  productId: string;
  price: number;
  colors?: string[];
  variants: VariantSummary[];
};

const encodeUssd = (price: number) => {
  const safePrice = Math.max(0, Math.round(price));
  const code = `*182*1*1*078xxxxxxx*${safePrice}#`;
  return `tel:${code.replace(/#/g, "%23")}`;
};

export default function ProductPurchase({
  productId,
  price,
  colors,
  variants,
}: ProductPurchaseProps) {
  const sizeOptions = useMemo(() => {
    if (!variants || variants.length === 0) {
      return [] as Array<{ value: string; disabled: boolean }>;
    }

    const stockBySize = variants.reduce<Record<string, number>>((acc, variant) => {
      const current = acc[variant.size] ?? 0;
      acc[variant.size] = current + Math.max(0, variant.stock ?? 0);
      return acc;
    }, {});

    const orderedSizes = sizeOrder.filter((size) => stockBySize[size] !== undefined);
    const additionalSizes = Object.keys(stockBySize).filter(
      (size) => !sizeOrder.includes(size as (typeof sizeOrder)[number]),
    );

    return [...orderedSizes, ...additionalSizes].map((value) => ({
      value,
      disabled: (stockBySize[value] ?? 0) <= 0,
    }));
  }, [variants]);

  const firstAvailableSize = useMemo(() => {
    if (sizeOptions.length === 0) {
      return null;
    }
    return sizeOptions.find((option) => !option.disabled)?.value ?? null;
  }, [sizeOptions]);

  const [size, setSize] = useState<string | null>(firstAvailableSize);

  useEffect(() => {
    setSize(firstAvailableSize);
  }, [firstAvailableSize]);

  const [color, setColor] = useState<string | undefined>(() => colors?.[0]);

  const formattedPrice = useMemo(() => `RWF ${price.toLocaleString()}`, [price]);

  const canDial = sizeOptions.length === 0 || Boolean(size);

  const handleDial = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!canDial) {
      event.preventDefault();
      return;
    }

    track("shop.pay_ussd", { productId, price, size, color });
  };

  return (
    <div className="space-y-3">
      {sizeOptions.length > 0 ? (
        <div className="space-y-2">
          <h2 className="section-title">Choose size</h2>
          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((option) => {
              const isActive = size === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`tile w-full ${isActive ? "bg-white/30 text-black" : ""}`}
                  onClick={() => setSize(option.value)}
                  aria-pressed={isActive}
                  disabled={option.disabled}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {colors && colors.length > 0 ? (
        <div className="space-y-2">
          <h2 className="section-title">Color</h2>
          <div className="flex flex-wrap gap-2">
            {colors.map((hex) => {
              const isActive = color === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  className={`h-11 w-11 rounded-full border-2 transition ${
                    isActive ? "border-white" : "border-white/40"
                  }`}
                  style={{ background: hex }}
                  onClick={() => setColor(hex)}
                  aria-pressed={isActive}
                />
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-white">{formattedPrice}</div>
        <a
          href={canDial ? encodeUssd(price) : undefined}
          className={`btn-primary block w-full text-center ${
            canDial ? "" : "cursor-not-allowed opacity-60"
          }`}
          onClick={handleDial}
          aria-disabled={!canDial}
        >
          Pay via USSD
        </a>
      </div>
    </div>
  );
}
