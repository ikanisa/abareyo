"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import type { Fixture, TicketZone } from "@/app/_data/fixtures";
import StadiumMap from "./StadiumMap";

type ZoneSheetProps = {
  fixture: Fixture | null;
  isOpen: boolean;
  onClose: () => void;
  onZoneSelect: (zone: TicketZone) => void;
};

const ZoneSheet = ({ fixture, isOpen, onClose, onZoneSelect }: ZoneSheetProps) => {
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveZoneId(null);
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !fixture) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label={`Close zone selection for ${fixture.title}`}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-ticket-overlay"
        tabIndex={-1}
        onClick={onClose}
      />
      <section
        className="relative z-10 flex w-full max-w-xl flex-col gap-5 rounded-t-3xl bg-[#020817] p-6 text-white shadow-2xl animate-ticket-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Select a zone for ${fixture.title}`}
      >
        <header className="space-y-2">
          <div className="h-1 w-16 self-center rounded-full bg-white/25" aria-hidden />
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Select your zone</p>
          <h2 className="text-2xl font-semibold leading-snug">{fixture.title}</h2>
          <p className="text-sm text-white/70">
            {fixture.date} · {fixture.time} · {fixture.venue}
          </p>
        </header>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Stadium map</p>
          <div className="mt-3 overflow-hidden rounded-2xl bg-black/30">
            <StadiumMap />
          </div>
        </div>
        <div className="space-y-3" role="list">
          {fixture.zones.map((zone) => {
            const soldOut = zone.seatsLeft === 0;
            const occupancy = Math.round(((zone.totalSeats - zone.seatsLeft) / zone.totalSeats) * 100);
            const seatsId = `${zone.id}-availability`;
            return (
              <button
                key={zone.id}
                type="button"
                role="listitem"
                aria-label={soldOut ? `${zone.name} zone sold out` : `Choose ${zone.name} zone for ${zone.price.toLocaleString()} RWF`}
                aria-describedby={seatsId}
                onClick={() => {
                  if (soldOut) {
                    return;
                  }
                  setActiveZoneId(zone.id);
                  window.setTimeout(() => {
                    onZoneSelect(zone);
                    setActiveZoneId(null);
                  }, 180);
                }}
                disabled={soldOut}
                className={clsx(
                  "flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition",
                  "min-h-[56px]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  "hover:shadow-lg hover:shadow-blue-500/15",
                  soldOut
                    ? "border-white/10 bg-white/5 text-white/50"
                    : "border-white/20 bg-white/10 hover:bg-white/20",
                  activeZoneId === zone.id ? "ring-2 ring-blue-400/80 animate-pulse" : null
                )}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide">{zone.name}</p>
                    <p id={seatsId} className="text-xs text-white/60">
                      {zone.seatsLeft} seats left · {occupancy}% full
                    </p>
                  </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{zone.price.toLocaleString()} RWF</p>
                  <p className="text-xs text-white/60">Tap to continue</p>
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-12 rounded-2xl bg-white/10 text-sm font-semibold text-white hover:bg-white/20"
        >
          Close
        </button>
      </section>
    </div>,
    document.body
  );
};

export default ZoneSheet;
