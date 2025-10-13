"use client";

import { useMemo, useState } from "react";

import { SACCO_LIST, formatRWF, recordDeposit } from "@/app/_data/services";

import UssdPayPanel from "../shared/UssdPayPanel";

type Props = {
  onClose: () => void;
};

const DepositForm = ({ onClose }: Props) => {
  const [saccoId, setSaccoId] = useState(SACCO_LIST[0]?.id ?? "");
  const [amount, setAmount] = useState(10000);
  const [paid, setPaid] = useState(false);

  const sacco = useMemo(() => SACCO_LIST.find((item) => item.id === saccoId), [saccoId]);
  const pointsEarned = useMemo(() => Math.round(amount * 0.02), [amount]);

  const handleSuccess = () => {
    setPaid(true);
    recordDeposit({
      id: crypto.randomUUID(),
      saccoId,
      amount,
      status: "confirmed",
      ref: `SMS-${Date.now().toString().slice(-6)}`,
      pointsEarned,
      at: new Date().toISOString(),
    });
  };

  return (
    <section className="card break-words whitespace-normal space-y-4" aria-label="SACCO deposit form">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-white">SACCO Deposit</h3>
        <p className="muted text-sm">Earn double fan points on successful deposits today.</p>
      </header>

      <label className="flex flex-col gap-2 text-sm text-white/80" htmlFor="sacco-select">
        Choose SACCO
        <select
          id="sacco-select"
          value={saccoId}
          onChange={(event) => setSaccoId(event.target.value)}
          className="rounded-xl bg-black/25 px-3 py-2 text-sm text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          {SACCO_LIST.map((item) => (
            <option key={item.id} value={item.id} className="text-black">
              {item.name}
              {item.branch ? ` (${item.branch})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm text-white/80" htmlFor="deposit-amount">
        Amount
        <input
          id="deposit-amount"
          type="number"
          min={1000}
          step={1000}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value) || 0)}
          className="rounded-xl bg-black/25 px-3 py-2 text-sm text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
          aria-describedby="deposit-helper"
        />
      </label>
      <p id="deposit-helper" className="text-xs text-white/60">
        {sacco ? `${sacco.name}${sacco.branch ? ` • ${sacco.branch}` : ""}` : "Select a SACCO"}
      </p>

      {!paid ? (
        <UssdPayPanel amount={amount} onSuccess={handleSuccess} />
      ) : (
        <div className="card break-words whitespace-normal space-y-3" role="status" aria-live="polite">
          <div className="text-white font-semibold">Deposit confirmed</div>
          <p className="muted text-sm">
            {formatRWF(amount)} added to your {sacco?.name ?? "SACCO"}. +{pointsEarned} fan points are on their way.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn sm:w-auto" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default DepositForm;
