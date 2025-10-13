"use client";

import Image from "next/image";
import clsx from "clsx";

import type { Fixture } from "@/app/_data/fixtures";

type FixtureCardProps = {
  fixture: Fixture;
  onSelect: (fixture: Fixture) => void;
};

const FixtureCard = ({ fixture, onSelect }: FixtureCardProps) => {
  const isSoldOut = fixture.status === "soldout" || fixture.zones.every((zone) => zone.seatsLeft === 0);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isSoldOut) {
          onSelect(fixture);
        }
      }}
      disabled={isSoldOut}
      aria-label={isSoldOut ? `${fixture.title} is sold out` : `Select seats for ${fixture.title}`}
      role="listitem"
      className={clsx(
        "relative h-56 w-64 shrink-0 overflow-hidden rounded-3xl text-left text-white transition-transform duration-200 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        "hover:scale-[1.02] focus-visible:scale-[1.02] active:scale-[0.99]",
        isSoldOut ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      )}
    >
      <Image
        alt={fixture.title}
        src={fixture.heroImage}
        fill
        className="object-cover"
        sizes="256px"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent" aria-hidden />
      <div className="relative flex h-full flex-col justify-between p-5">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">{fixture.comp}</p>
          <h2 className="text-lg font-semibold leading-tight">{fixture.title}</h2>
          <p className="text-sm text-white/80">
            {fixture.date} · {fixture.time}
          </p>
          <p className="text-xs text-white/60">{fixture.venue}</p>
        </header>
        <div
          className={clsx(
            "mt-3 inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
            isSoldOut ? "bg-white/20 text-white/60" : "bg-white/80 text-blue-900 hover:bg-white"
          )}
        >
          {isSoldOut ? "Sold out" : "Select seats"}
        </div>
      </div>
    </button>
  );
};

export default FixtureCard;
