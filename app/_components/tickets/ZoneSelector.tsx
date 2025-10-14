"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/track";

type Zone = {
  id: string;
  name: string;
  price: number;
};

type ZoneSelectorProps = {
  zones: Zone[];
  matchId: string;
};

const normaliseZoneName = (name: string) => (name === "Fan" ? "Blue" : name);

const buildUssdHref = (price: number) => {
  const safePrice = Math.max(0, Math.round(price));
  const code = `*182*1*1*078xxxxxxx*${safePrice}#`;
  return `tel:${code.replace(/#/g, "%23")}`;
};

export default function ZoneSelector({ zones, matchId }: ZoneSelectorProps) {
  const [selectedId, setSelectedId] = useState(zones[0]?.id ?? "");

  const activeZone = useMemo(() => {
    if (!selectedId) {
      return zones[0];
    }
    return zones.find((zone) => zone.id === selectedId) ?? zones[0];
  }, [selectedId, zones]);

  if (!activeZone) {
    return null;
  }

  const handleDial = () => {
    track("tickets.pay_ussd", { matchId, zoneId: activeZone.id, price: activeZone.price });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {zones.map((zone) => {
          const label = normaliseZoneName(zone.name);
          const isActive = activeZone.id === zone.id;
          return (
            <button
              key={zone.id}
              type="button"
              className={`tile w-full ${isActive ? "bg-white/30 text-black" : ""}`}
              onClick={() => setSelectedId(zone.id)}
              aria-pressed={isActive}
            >
              <span>{label}</span>
              <span className="block text-xs text-white/80">RWF {zone.price.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
      <a
        href={buildUssdHref(activeZone.price)}
        className="btn-primary block w-full text-center"
        onClick={handleDial}
      >
        Pay via USSD
      </a>
      <p className="muted text-xs">On iOS, copy the USSD code if the dialer does not open.</p>
    </div>
  );
}
