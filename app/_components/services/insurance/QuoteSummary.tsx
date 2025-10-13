"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  findQuoteById,
  formatRWF,
  recordPolicy,
  recordQuote,
  updateQuoteStatus,
} from "@/app/_data/services";

import PerkBanner from "../PerkBanner";
import UssdPayPanel from "../shared/UssdPayPanel";

type Props = {
  plate: string;
  motoType: "moto" | "car";
  period: number;
  partnerId: string;
  onClose: () => void;
  onBack: () => void;
};

const QuoteSummary = ({ plate, motoType, period, partnerId, onClose, onBack }: Props) => {
  const basePremium = motoType === "moto" ? 15000 : 35000;
  const premium = useMemo(() => Math.round(basePremium * (period / 12)), [basePremium, period]);
  const eligible = premium >= 25000;
  const [paid, setPaid] = useState(false);
  const [quoteId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (findQuoteById(quoteId)) {
      return;
    }
    recordQuote({
      id: quoteId,
      partnerId,
      motoType,
      plate,
      periodMonths: period,
      premium,
      addons: [],
      ticketPerk: {
        eligible,
        zone: eligible ? "BLUE" : "BLUE",
        ruleText: "Policies ≥ 25k RWF ⇒ 1 free BLUE ticket",
      },
      status: "quoted",
    });
  }, [eligible, motoType, partnerId, period, plate, premium, quoteId]);

  const handleSuccess = () => {
    setPaid(true);
    updateQuoteStatus(quoteId, "paid");

    const now = new Date();
    const validFrom = now.toISOString().split("T")[0];
    const validToDate = new Date(now);
    validToDate.setMonth(validToDate.getMonth() + period);
    const validTo = validToDate.toISOString().split("T")[0];

    recordPolicy({
      id: crypto.randomUUID(),
      quoteId,
      number: `RS-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}${now.getMinutes()}`,
      validFrom,
      validTo,
      ticketPerkIssued: eligible ? false : undefined,
    });

    updateQuoteStatus(quoteId, "issued");
  };

  return (
    <section className="card space-y-4" aria-label="Quote summary">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Quote Summary</h3>
        <p className="muted text-sm">
          {motoType.toUpperCase()} · Plate {plate || "—"} · {period} month cover
        </p>
      </header>

      <div className="card bg-white/5">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>Premium</span>
          <strong className="text-white">{formatRWF(premium)}</strong>
        </div>
      </div>

      {eligible ? <PerkBanner text="Free BLUE Zone ticket after payment." /> : null}

      {!paid ? (
        <>
          <UssdPayPanel amount={premium} onSuccess={handleSuccess} />
          <div className="flex justify-end">
            <button type="button" className="btn" onClick={onBack}>
              Edit details
            </button>
          </div>
        </>
      ) : (
        <div className="card space-y-3" role="status" aria-live="polite">
          <div className="text-white font-semibold">Payment received</div>
          <p className="muted text-sm">
            We are issuing your policy now. Use Claim perk to jump to My Tickets with your perk flagged.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn sm:w-auto" onClick={onBack}>
              Back
            </button>
            {eligible ? (
              <Link
                href={{ pathname: "/tickets", query: { perk: "blue" } }}
                className="btn-primary sm:w-auto text-center"
                onClick={onClose}
              >
                Claim perk
              </Link>
            ) : (
              <button type="button" className="btn-primary sm:w-auto" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default QuoteSummary;
