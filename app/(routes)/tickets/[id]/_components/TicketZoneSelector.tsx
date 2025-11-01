"use client";

import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";

import type { ReactNode } from "react";

type Zone = {
  zone: string;
  price: number;
  capacity: number;
  remaining: number;
  gate?: string;
};

type TicketZoneSelectorProps = {
  zones: Zone[];
  renderPay: (amount: number) => ReactNode;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(value);

const TicketZoneSelector = ({ zones, renderPay }: TicketZoneSelectorProps) => {
  const orderedZones = useMemo(() => {
    if (!Array.isArray(zones) || zones.length === 0) {
      return [
        { zone: "Blue", price: 5000, capacity: 0, remaining: 0 },
        { zone: "Regular", price: 7000, capacity: 0, remaining: 0 },
        { zone: "VIP", price: 15000, capacity: 0, remaining: 0 },
      ];
    }
    return [...zones].sort((a, b) => a.price - b.price);
  }, [zones]);

  const [selectedZone, setSelectedZone] = useState(orderedZones[0]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {orderedZones.map((zone) => {
          const isActive = zone.zone === selectedZone.zone;
          return (
            <button
              key={zone.zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-white/60 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-white/80 hover:border-white/30"
              }`}
              aria-pressed={isActive}
            >
              <p className="text-sm font-semibold uppercase tracking-wide">{zone.zone}</p>
              <p className="text-lg font-bold">{formatCurrency(zone.price)}</p>
              <p className="text-[11px] text-white/60">
                {zone.remaining > 0 ? `${zone.remaining} seats left` : "Limited availability"}
              </p>
            </button>
          );
        })}
      </div>

      <GlassCard className="p-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Selected zone</p>
          <p className="text-lg font-semibold text-white">{selectedZone.zone}</p>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-white/70">Amount</span>
          <span className="text-2xl font-bold text-white">{formatCurrency(selectedZone.price)}</span>
        </div>
        <div className="space-y-2">
          {typeof renderPay === "function" ? renderPay(selectedZone.price) : null}
          <p className="text-[11px] text-white/60">
            Dial the code and approve payment to receive your digital pass via SMS.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default TicketZoneSelector;
