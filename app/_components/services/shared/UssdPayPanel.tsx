"use client";

import { useEffect, useMemo, useState } from "react";

import { formatRWF } from "@/app/_data/services";

const networks = [
  { id: "mtn", label: "MTN MoMo", shortcode: "*182*1*1*078xxxxxxx*" },
  { id: "airtel", label: "Airtel Money", shortcode: "*182*1*1*073xxxxxxx*" },
] as const;

const UssdPayPanel = ({ amount, onSuccess }: { amount: number; onSuccess: () => void }) => {
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!pending) {
      setReference("");
    }
  }, [pending]);

  const telLinks = useMemo(
    () =>
      networks.map((network) => ({
        ...network,
        href: `tel:${network.shortcode}${Math.max(0, Math.round(amount))}%23`,
      })),
    [amount],
  );

  return (
    <div className="card break-words whitespace-normal break-words whitespace-normal space-y-3" aria-live="polite">
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>Total</span>
        <strong className="text-white">{formatRWF(Math.max(0, Math.round(amount)))}</strong>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {telLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className="tile text-sm font-semibold"
            aria-label={`Pay ${formatRWF(amount)} with ${link.label}`}
          >
            {link.label}
          </a>
        ))}
      </div>
      {!pending ? (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => setPending(true)}
          aria-label="I have paid via USSD"
          disabled={amount <= 0}
        >
          I have paid
        </button>
      ) : (
        <div className="space-y-2">
          <p className="muted text-xs">
            Waiting for SMS confirmation… If you already received the confirmation SMS, enter the reference and confirm.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="flex-1 rounded-xl bg-black/25 px-3 py-2 text-sm text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
              placeholder="SMS reference"
              aria-label="Enter payment reference"
            />
            <button
              type="button"
              className="btn sm:w-auto"
              onClick={() => onSuccess()}
              disabled={amount <= 0}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UssdPayPanel;
