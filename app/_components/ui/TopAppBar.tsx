"use client";

import { motion } from "framer-motion";

type TopAppBarProps = {
  onOpenOnboarding?: () => void;
};

export default function TopAppBar({ onOpenOnboarding }: TopAppBarProps) {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-saturate-150"
    >
      <div className="flex items-center gap-2">
        <div aria-label="Rayon logo" className="h-8 w-8 rounded-xl bg-white/90" />
        <span className="font-semibold text-white">Rayon Sports</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" aria-label="Notifications">
          🔔
        </button>
        <button className="btn" aria-label="Search">
          🔍
        </button>
        <button className="btn" aria-label="Language">
          RW/EN
        </button>
        {onOpenOnboarding ? (
          <button className="btn" aria-label="Open onboarding" onClick={onOpenOnboarding}>
            💬
          </button>
        ) : null}
      </div>
    </motion.header>
  );
}
