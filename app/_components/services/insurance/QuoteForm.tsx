"use client";

import { FormEvent, useMemo, useState } from "react";

import QuoteSummary from "./QuoteSummary";

const coverageOptions = [3, 6, 12] as const;

type Props = {
  partnerId: string;
  onClose: () => void;
};

const QuoteForm = ({ partnerId, onClose }: Props) => {
  const [plate, setPlate] = useState("");
  const [motoType, setMotoType] = useState<"moto" | "car">("moto");
  const [period, setPeriod] = useState<(typeof coverageOptions)[number]>(12);
  const [step, setStep] = useState<"form" | "summary">("form");

  const canProceed = useMemo(() => plate.trim().length >= 3, [plate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canProceed) {
      return;
    }
    setStep("summary");
  };

  if (step === "summary") {
    return (
      <QuoteSummary
        plate={plate}
        motoType={motoType}
        period={period}
        partnerId={partnerId}
        onClose={onClose}
        onBack={() => setStep("form")}
      />
    );
  }

  return (
    <form className="card break-words whitespace-normal space-y-4" onSubmit={handleSubmit} aria-label="Motor insurance quote form">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Motor Insurance</p>
        <h3 className="text-lg font-semibold text-white">Get an instant quote</h3>
      </header>

      <fieldset className="space-y-2" aria-label="Vehicle type">
        <legend className="text-sm font-medium text-white/80">Vehicle</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["moto", "car"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMotoType(type)}
              className={`tile ${motoType === type ? "bg-white/25 text-white" : "text-white/80"}`}
              aria-pressed={motoType === type}
            >
              {type === "moto" ? "Moto" : "Car"}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm text-white/80" htmlFor="vehicle-plate">
        Plate Number
        <input
          id="vehicle-plate"
          value={plate}
          onChange={(event) => setPlate(event.target.value.toUpperCase())}
          placeholder="RAX 123A"
          className="rounded-xl bg-black/25 px-3 py-2 text-sm text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
          required
        />
      </label>

      <fieldset className="space-y-2" aria-label="Coverage period">
        <legend className="text-sm font-medium text-white/80">Coverage Period</legend>
        <div className="grid grid-cols-3 gap-2">
          {coverageOptions.map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => setPeriod(months)}
              className={`tile ${period === months ? "bg-white/25 text-white" : "text-white/80"}`}
              aria-pressed={period === months}
            >
              {months} months
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn sm:w-auto" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary sm:w-auto" disabled={!canProceed}>
          Get Quote
        </button>
      </div>
    </form>
  );
};

export default QuoteForm;
