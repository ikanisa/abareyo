"use client";

import { useCallback, useMemo, useState } from "react";

import { buildUssd, formatTelUri, isIOS, sanitizeAmount, type Provider } from "@/lib/ussd";

let clipboardModule: { setStringAsync?: (value: string) => Promise<void> } | null = null;

async function copyWithExpoClipboard(payload: string) {
  if (clipboardModule?.setStringAsync) {
    await clipboardModule.setStringAsync(payload);
    return true;
  }

  try {
    clipboardModule = await import("expo-clipboard");
    if (clipboardModule?.setStringAsync) {
      await clipboardModule.setStringAsync(payload);
      return true;
    }
  } catch (error) {
    console.warn("expo-clipboard unavailable", error);
  }
  return false;
}

function fallbackCopy(payload: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(payload).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

type Props = {
  amount: number;
  phone?: string;
  provider?: Provider;
  onCopied?: () => void;
  className?: string;
  disabled?: boolean;
  disabledLabel?: string;
};

const buildDisplayCode = (href: string) => href.replace(/^tel:/i, "").replace(/%23/gi, "#");

export const UssdPayButton = ({
  amount,
  phone,
  provider = "mtn",
  onCopied,
  className,
  disabled = false,
  disabledLabel = "Unavailable",
}: Props) => {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const sanitizedAmount = useMemo(() => Number.parseInt(sanitizeAmount(amount), 10), [amount]);
  const isDisabled = disabled || !Number.isFinite(sanitizedAmount) || sanitizedAmount <= 0;
  const href = useMemo(
    () => (isDisabled ? "" : buildUssd({ amount: sanitizedAmount, phone, provider })),
    [isDisabled, sanitizedAmount, phone, provider],
  );
  const displayCode = useMemo(() => (href ? buildDisplayCode(href) : ""), [href]);
  const ios = isIOS();

  const handleCopy = useCallback(async () => {
    const raw = formatTelUri(displayCode).replace(/^tel:/i, "");
    const copied = (await copyWithExpoClipboard(raw)) || (await fallbackCopy(raw));
    setCopyStatus(copied ? "copied" : "failed");
    if (copied) {
      onCopied?.();
    }
  }, [displayCode, onCopied]);

  return (
    <div className={className}>
      {isDisabled ? (
        <button type="button" className="btn-primary w-full cursor-not-allowed opacity-60" disabled aria-disabled>
          {disabledLabel}
        </button>
      ) : (
        <a className="btn-primary w-full" href={href} aria-label="Pay via USSD">
          Pay via USSD
        </a>
      )}
      {ios && !isDisabled ? (
        <button type="button" className="btn mt-2 w-full" onClick={handleCopy} aria-label="Copy USSD code">
          {copyStatus === "copied" ? "Code copied" : "Copy USSD"}
        </button>
      ) : null}
    </div>
  );
};

export default UssdPayButton;
