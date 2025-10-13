"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Smartphone, Sparkles, Tags, X } from "lucide-react";

import useDialogFocusTrap from "../_hooks/useDialogFocusTrap";
import { useShopLocale } from "../_hooks/useShopLocale";

const STORAGE_KEY = "abareyo:shop-onboarded";

const ShopOnboarding = () => {
  const { t } = useShopLocale();
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const timeout = window.setTimeout(() => setOpen(true), 320);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, []);

  const close = (persist = true) => {
    if (persist && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  };

  const containerRef = useDialogFocusTrap<HTMLDivElement>(open, {
    onClose: () => close(true),
  });

  const steps = useMemo(
    () => [
      {
        id: "browse",
        icon: Sparkles,
        title: t("onboarding.stepOne.title"),
        body: t("onboarding.stepOne.body"),
      },
      {
        id: "filter",
        icon: Tags,
        title: t("onboarding.stepTwo.title"),
        body: t("onboarding.stepTwo.body"),
      },
      {
        id: "pay",
        icon: Smartphone,
        title: t("onboarding.stepThree.title"),
        body: t("onboarding.stepThree.body"),
      },
    ],
    [t],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("onboarding.title").primary}
            className="card relative w-full max-w-md rounded-t-3xl bg-[#10215b] text-white"
            initial={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            transition={{ type: prefersReducedMotion ? "tween" : "spring", stiffness: 260, damping: 30 }}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold leading-tight">
                  {t("onboarding.title").primary}
                  <span className="block text-sm font-normal text-white/70">
                    {t("onboarding.title").secondary}
                  </span>
                </h2>
                <p className="text-sm text-white/70">
                  {t("onboarding.subtitle").primary}
                  <span className="block text-xs text-white/60">{t("onboarding.subtitle").secondary}</span>
                </p>
              </div>
              <button
                type="button"
                className="btn h-11 w-11 rounded-full"
                onClick={() => close(true)}
                aria-label={`${t("onboarding.skip").primary} / ${t("onboarding.skip").secondary}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <ol className="mt-6 space-y-4 text-sm text-white/80">
              {steps.map((step) => (
                <li key={step.id} className="flex gap-3 rounded-2xl bg-white/10 p-3">
                  <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                    <step.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-white">
                      {step.title.primary}
                      <span className="block text-xs font-normal text-white/60">{step.title.secondary}</span>
                    </p>
                    <p>
                      {step.body.primary}
                      <span className="block text-xs text-white/60">{step.body.secondary}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn flex-1 min-h-[44px]"
                onClick={() => close(true)}
              >
                {t("onboarding.skip").primary}
                <span className="block text-xs text-white/60">{t("onboarding.skip").secondary}</span>
              </button>
              <button
                type="button"
                className="btn-primary flex-1 min-h-[44px]"
                onClick={() => close(true)}
              >
                {t("onboarding.cta").primary}
                <span className="block text-xs text-white/70">{t("onboarding.cta").secondary}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShopOnboarding;
