"use client";

import { useMemo } from "react";

import useShopLocale from "../_hooks/useShopLocale";

type Provider = "mtn" | "airtel";

type UssdPayButtonProps = {
  amount: number;
  phone?: string;
  provider?: Provider;
};

const buildCode = (amount: number, phone?: string, provider: Provider = "mtn") => {
  const safeAmount = Math.max(Math.floor(amount), 0);
  const fallback = provider === "mtn" ? "0780000000" : "0730000000";
  const digits = (phone ?? fallback).replace(/[^0-9]/g, "");
  const cleaned = digits || fallback;
  const prefix = "*182*1*1*";
  return `${prefix}${cleaned}*${safeAmount}%23`;
};

const UssdPayButton = ({ amount, phone, provider = "mtn" }: UssdPayButtonProps) => {
  const strings = useShopLocale();
  const code = useMemo(() => buildCode(amount, phone, provider), [amount, phone, provider]);
  const href = `tel:${code}`;

  const isiOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="space-y-2">
      <a className="btn-primary w-full text-center" href={href} aria-label={strings.payViaUSSD}>
        {strings.payViaUSSD}
      </a>
      {isiOS ? (
        <button
          type="button"
          className="btn w-full"
          onClick={() => navigator.clipboard?.writeText(code)}
        >
          Copy USSD
        </button>
      ) : null}
    </div>
  );
};

export default UssdPayButton;
