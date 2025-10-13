"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@/app/_data/shop_v2";

type HybridPayModalProps = {
  total: number;
  walletBalance: number;
  points: number;
  ussdCode?: string;
  triggerLabel?: string;
  disabled?: boolean;
};

const sliderClassName = "relative flex h-2 w-full items-center";

const HybridPayModal = ({
  total,
  walletBalance,
  points,
  ussdCode = "*182*7*1#",
  triggerLabel = "Checkout with Hybrid Pay",
  disabled = false,
}: HybridPayModalProps) => {
  const maxPoints = useMemo(() => Math.min(points, Math.floor(total * 0.2)), [points, total]);
  const [open, setOpen] = useState(false);
  const [pointsUsed, setPointsUsed] = useState(() => maxPoints);
  const [walletUsed, setWalletUsed] = useState(() => Math.min(walletBalance, Math.max(total - maxPoints, 0)));

  useEffect(() => {
    if (disabled || total <= 0) {
      setOpen(false);
    }
  }, [disabled, total]);

  useEffect(() => {
    setPointsUsed((current) => Math.min(current, maxPoints));
  }, [maxPoints]);

  useEffect(() => {
    const walletCap = Math.max(0, Math.min(walletBalance, total - pointsUsed));
    setWalletUsed((current) => Math.min(current, walletCap));
  }, [walletBalance, pointsUsed, total]);

  const cashDue = Math.max(total - pointsUsed - walletUsed, 0);
  const summary = `${formatCurrency(walletUsed)} wallet + ${pointsUsed} pts + ${formatCurrency(cashDue)} via USSD`;

  if (disabled || total <= 0) {
    return (
      <button type="button" className="btn-primary w-full cursor-not-allowed opacity-60 sm:w-auto" disabled>
        {triggerLabel}
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="btn-primary w-full sm:w-auto">{triggerLabel}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="card fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 space-y-6 p-6">
          <div className="space-y-2">
            <Dialog.Title className="text-2xl font-semibold text-white">Hybrid Pay</Dialog.Title>
            <Dialog.Description className="text-sm text-white/70">
              Combine wallet balance and fan points, then finish with a USSD push. Adjust sliders to suit your spend.
            </Dialog.Description>
          </div>
          <div className="space-y-5">
            <section className="space-y-3">
              <header className="flex items-center justify-between text-sm text-white/70">
                <span>Total due</span>
                <span className="text-xl font-semibold text-white">{formatCurrency(total)}</span>
              </header>
              <div className="space-y-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Fan points</span>
                    <span>
                      {pointsUsed} / {maxPoints} pts
                    </span>
                  </div>
                  <Slider.Root
                    className={`${sliderClassName} mt-3`}
                    max={maxPoints}
                    min={0}
                    step={100}
                    value={[pointsUsed]}
                    onValueChange={(value) => setPointsUsed(value[0] ?? 0)}
                    aria-label="Fan points to use"
                  >
                    <Slider.Track className="relative h-2 flex-1 rounded-full bg-white/15">
                      <Slider.Range className="absolute h-2 rounded-full bg-emerald-400" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-5 w-5 rounded-full bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" />
                  </Slider.Root>
                  <p className="mt-2 text-xs text-white/60">Max 20% of cart can be paid with points.</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Wallet balance</span>
                    <span>{formatCurrency(walletUsed)}</span>
                  </div>
                  <Slider.Root
                    className={`${sliderClassName} mt-3`}
                    max={Math.max(0, Math.min(walletBalance, total - pointsUsed))}
                    min={0}
                    step={500}
                    value={[walletUsed]}
                    onValueChange={(value) => setWalletUsed(value[0] ?? 0)}
                    aria-label="Wallet amount to apply"
                  >
                    <Slider.Track className="relative h-2 flex-1 rounded-full bg-white/15">
                      <Slider.Range className="absolute h-2 rounded-full bg-blue-400" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-5 w-5 rounded-full bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" />
                  </Slider.Root>
                  <p className="mt-2 text-xs text-white/60">
                    Wallet balance {formatCurrency(walletBalance)} remaining.
                  </p>
                </div>
              </div>
            </section>
            <section className="rounded-2xl bg-white/10 p-4 text-sm text-white" aria-live="polite">
              <div className="flex items-center justify-between text-white/80">
                <span>USSD payment</span>
                <span className="text-lg font-semibold">{formatCurrency(cashDue)}</span>
              </div>
              <p className="mt-2 text-white/70">We will send a prompt to your registered mobile line.</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-white/60">{summary}</p>
            </section>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close className="btn w-full sm:w-auto">Cancel</Dialog.Close>
            <a
              className="btn-primary w-full text-center sm:w-auto"
              href={`tel:${encodeURIComponent(ussdCode)}`}
              onClick={() => setOpen(false)}
            >
              Pay via USSD
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default HybridPayModal;
