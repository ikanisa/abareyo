"use client";

import type { ReactNode } from "react";

type TopAppBarProps = {
  right?: ReactNode;
};

const TopAppBar = ({ right }: TopAppBarProps) => (
  <header className="sticky top-0 z-40 glass flex items-center justify-between px-3 py-3 backdrop-saturate-150">
    <div className="flex items-center gap-2">
      <div aria-label="Rayon logo" className="h-8 w-8 rounded-xl bg-white/90" />
      <span className="text-white font-semibold">Rayon Sports</span>
    </div>
    <div className="flex items-center gap-2">{right}</div>
  </header>
);

export default TopAppBar;
