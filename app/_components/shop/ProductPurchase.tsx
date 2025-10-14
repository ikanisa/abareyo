"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/track";

const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;

type ProductPurchaseProps = {
  productId: string;
  price: number;
  colors?: string[];
};

const encodeUssd = (price: number) => {
  const safePrice = Math.max(0, Math.round(price));
  const code = `*182*1*1*078xxxxxxx*${safePrice}#`;
  return `tel:${code.replace(/#/g, "%23")}`;
};

export default function ProductPurchase({ productId, price, colors }: ProductPurchaseProps) {
  const [size, setSize] = useState<(typeof defaultSizes)[number]>("M");
  const [color, setColor] = useState<string | undefined>(() => colors?.[0]);

  const formattedPrice = useMemo(() => `RWF ${price.toLocaleString()}`, [price]);

  const handleDial = () => {
    track("shop.pay_ussd", { productId, price, size, color });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h2 className="section-title">Choose size</h2>
        <div className="grid grid-cols-3 gap-2">
          {defaultSizes.map((option) => {
            const isActive = size === option;
            return (
              <button
                key={option}
                type="button"
                className={`tile w-full ${isActive ? "bg-white/30 text-black" : ""}`}
                onClick={() => setSize(option)}
                aria-pressed={isActive}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
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
          href={encodeUssd(price)}
          className="btn-primary block w-full text-center"
          onClick={handleDial}
        >
          Pay via USSD
        </a>
      </div>
    </div>
  );
}
