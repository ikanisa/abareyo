"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildUssdString,
  createUssdCopyEvent,
  createUssdLaunchEvent,
  formatTelUri,
  formatUssdDisplay,
  isIOS,
  sanitizeAmount,
  type Provider,
} from "@rayon/api/payments/ussd";

import { recordAppStateEvent } from "@/lib/observability";

const DISABLED_STATES = new Set(["off", "disabled", "false", "0", "none"]);

const environmentLabel = (process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? "").trim().toLowerCase();
const isProductionEnv = environmentLabel === "production" || environmentLabel === "prod";

const parseRolloutEnabled = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalised = value.trim().toLowerCase();
  if (!normalised) {
    return fallback;
  }

  if (DISABLED_STATES.has(normalised)) {
    return false;
  }

  if (normalised === "internal") {
    return !isProductionEnv;
  }

  if (normalised === "beta") {
    return !isProductionEnv;
  }

  return true;
};

const COPY_ROLLOUT_ENABLED = parseRolloutEnabled(process.env.NEXT_PUBLIC_ROLLOUT_USSD_COPY, false);
const ANALYTICS_ENABLED = parseRolloutEnabled(process.env.NEXT_PUBLIC_ROLLOUT_USSD_ANALYTICS, true);

export type UssdPayButtonProps = {
  amount: number;
  phone?: string;
  provider?: Provider;
  onCopied?: () => void;
  className?: string;
  disabled?: boolean;
  disabledLabel?: string;
};

const attemptClipboardCopy = async (payload: string): Promise<boolean> => {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
      return true;
    }
  } catch {
    // Ignore clipboard failures and fall back to manual dialling
  }

  return false;
};

const COPY_STATUS_LABEL: Record<"idle" | "copied" | "failed", string> = {
  idle: "Copy USSD",
  copied: "Code copied",
  failed: "Copy failed — dial manually",
};

export function UssdPayButton({
  amount,
  phone,
  provider = "mtn",
  onCopied,
  className,
  disabled = false,
  disabledLabel = "Unavailable",
}: UssdPayButtonProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const sanitisedAmount = useMemo(() => Number.parseInt(sanitizeAmount(amount), 10), [amount]);
  const isAmountInvalid = !Number.isFinite(sanitisedAmount) || sanitisedAmount <= 0;
  const isDisabled = disabled || isAmountInvalid;

  const rawCode = useMemo(
    () => (isDisabled ? "" : buildUssdString({ amount: sanitisedAmount, phone, provider })),
    [isDisabled, sanitisedAmount, phone, provider],
  );
  const href = useMemo(() => (rawCode ? formatTelUri(rawCode) : ""), [rawCode]);
  const displayCode = useMemo(() => (href ? formatUssdDisplay(href) : ""), [href]);
  const ios = isIOS();
  const copyEnabled = COPY_ROLLOUT_ENABLED && ios && !isDisabled;

  useEffect(() => {
    setCopyStatus("idle");
  }, [displayCode]);

  const handleDialAnalytics = useCallback(() => {
    if (!ANALYTICS_ENABLED || !href) {
      return;
    }

    void recordAppStateEvent(
      createUssdLaunchEvent({
        href,
        original: rawCode,
        fallbackConfigured: copyEnabled,
      }),
    );
  }, [copyEnabled, href, rawCode]);

  const handleCopy = useCallback(async () => {
    if (!copyEnabled || !displayCode) {
      return;
    }

    const copied = await attemptClipboardCopy(displayCode);
    setCopyStatus(copied ? "copied" : "failed");

    if (copied) {
      onCopied?.();
    }

    if (ANALYTICS_ENABLED) {
      void recordAppStateEvent(
        createUssdCopyEvent({
          displayCode,
          succeeded: copied,
        }),
      );
    }
  }, [copyEnabled, displayCode, onCopied]);

  return (
    <div className={className} data-testid="ussd-pay-button">
      {isDisabled ? (
        <button
          type="button"
          className="btn-primary w-full cursor-not-allowed opacity-60"
          disabled
          aria-disabled
        >
          {disabledLabel}
        </button>
      ) : (
        <a
          className="btn-primary w-full"
          href={href}
          aria-label="Pay via USSD"
          onClick={handleDialAnalytics}
        >
          Pay via USSD
        </a>
      )}

      {copyEnabled ? (
        <div className="mt-2 space-y-1">
          <button type="button" className="btn w-full" onClick={handleCopy} aria-label="Copy USSD code">
            {COPY_STATUS_LABEL[copyStatus]}
          </button>
          <p className="text-center text-xs text-muted-foreground" aria-live="polite">
            Dial <span data-testid="ussd-display-code">{displayCode}</span> once pasted into the dialer.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default UssdPayButton;
