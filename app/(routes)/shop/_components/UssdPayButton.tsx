"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, PhoneCall, X } from "lucide-react";

import {
  PAYMENT_METHODS,
  type PaymentMethod,
  createUssdCode,
  formatPrice,
} from "../_logic/useShop";
import useDialogFocusTrap from "../_hooks/useDialogFocusTrap";
import { useShopLocale } from "../_hooks/useShopLocale";

type UssdPayButtonProps = {
  amount: number;
  phone?: string;
  provider?: PaymentMethod;
  onReferenceCaptured?: (reference: string) => void;
};

const referencePlaceholder = "e.g. MTN12345";

const UssdPayButton = ({ amount, phone, provider = "mtn", onReferenceCaptured }: UssdPayButtonProps) => {
  const [dialing, setDialing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(provider);
  const [showOverlay, setShowOverlay] = useState(false);
  const [referenceInput, setReferenceInput] = useState("");
  const [referenceError, setReferenceError] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const { t } = useShopLocale();

  const closeOverlay = () => {
    setShowOverlay(false);
    setDialing(false);
  };
  const overlayRef = useDialogFocusTrap<HTMLDivElement>(showOverlay, { onClose: closeOverlay });

  const disabled = amount <= 0;

  useEffect(() => {
    setDialing(false);
    setShowOverlay(false);
    setReferenceInput("");
    setReferenceError(false);
    setSelectedMethod(provider);
  }, [amount, phone, provider]);

  useEffect(() => {
    if (!showOverlay) {
      setReferenceInput("");
      setReferenceError(false);
    }
  }, [showOverlay]);

  const href = useMemo(() => createUssdCode(phone ?? "", amount, selectedMethod), [amount, phone, selectedMethod]);
  const idleLabel = t("ussd.buttonIdle");
  const waitingLabel = t("ussd.buttonWaiting");
  const buttonCopy = dialing ? waitingLabel : idleLabel;
  const buttonPrimary = dialing ? buttonCopy.primary : `${buttonCopy.primary} (${formatPrice(amount)})`;

  const handleDial = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    setDialing(true);
    setShowOverlay(true);
  };

  const handleReferenceSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = referenceInput.trim();
    if (!value) {
      setReferenceError(true);
      return;
    }
    setReferenceError(false);
    setSubmittedReference(value);
    onReferenceCaptured?.(value);
  };

  return (
    <div className="card space-y-4 bg-white/10 text-white">
      <div>
        <h3 className="text-base font-semibold">
          {t("ussd.title").primary}
          <span className="block text-sm font-normal text-white/70">{t("ussd.title").secondary}</span>
        </h3>
        <p className="text-sm text-white/70">
          {t("ussd.description").primary}
          <span className="block text-xs text-white/60">{t("ussd.description").secondary}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const active = method.id === selectedMethod;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={`tile h-20 justify-start gap-2 text-left ${
                active ? "border border-white/40 bg-white/25" : "bg-white/10"
              }`}
              aria-pressed={active}
            >
              <span className="text-sm font-semibold text-white">{method.label}</span>
              <span className="text-xs text-white/70">
                {method.description}
                <span className="block text-[10px] text-white/50">{method.descriptionRw}</span>
              </span>
            </button>
          );
        })}
      </div>

      <a
        href={href}
        className={`btn-primary flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
        onClick={handleDial}
        aria-disabled={disabled}
      >
        {dialing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PhoneCall className="h-4 w-4" aria-hidden />}
        <span className="flex flex-col items-center text-center">
          <span>{buttonPrimary}</span>
          <span className="text-[10px] text-white/70">{buttonCopy.secondary}</span>
        </span>
      </a>

      <p className="text-xs text-white/70">
        {t("ussd.hint").primary}
        <span className="block text-[11px] text-white/60">{t("ussd.hint").secondary}</span>
      </p>

      {submittedReference && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <span>
            {t("ussd.referenceSaved").primary}: {submittedReference}
            <span className="block text-[10px] text-emerald-100/80">{t("ussd.referenceSaved").secondary}</span>
          </span>
        </div>
      )}

      {showOverlay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Waiting for USSD confirmation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        >
          <div ref={overlayRef} className="card w-full max-w-sm space-y-4 bg-white/10 text-white">
            <header className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-semibold">{t("ussd.overlayTitle").primary}</h4>
                <p className="text-xs text-white/70" aria-live="polite">
                  {t("ussd.overlayDescription").primary}
                  <span className="block text-[10px] text-white/60">{t("ussd.overlayDescription").secondary}</span>
                  <span className="block text-xs text-white/70">
                    {PAYMENT_METHODS.find((entry) => entry.id === selectedMethod)?.label ?? ""} • {formatPrice(amount)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeOverlay}
                className="btn h-11 w-11 rounded-full p-0 text-white"
                aria-label="Close waiting window"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <form onSubmit={handleReferenceSubmit} className="space-y-2">
              <label className="text-xs text-white/70">
                {t("ussd.referenceLabel").primary}
                <span className="block text-[10px] text-white/60">{t("ussd.referenceLabel").secondary}</span>
                <input
                  value={referenceInput}
                  onChange={(event) => setReferenceInput(event.target.value.replace(/[^0-9A-Za-z-]/g, ""))}
                  placeholder={referencePlaceholder}
                  className="mt-1 h-11 w-full rounded-2xl bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/70"
                />
              </label>
              {referenceError && (
                <p className="text-xs text-rose-200">
                  {t("ussd.referenceError").primary}
                  <span className="block text-[10px] text-rose-100/80">{t("ussd.referenceError").secondary}</span>
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn flex-1 min-h-[44px]"
                  onClick={closeOverlay}
                >
                  {t("ussd.enterLater").primary}
                  <span className="block text-[10px] text-white/60">{t("ussd.enterLater").secondary}</span>
                </button>
                <button type="submit" className="btn-primary flex-1 min-h-[44px]">
                  {t("ussd.saveReference").primary}
                  <span className="block text-[10px] text-white/70">{t("ussd.saveReference").secondary}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UssdPayButton;
