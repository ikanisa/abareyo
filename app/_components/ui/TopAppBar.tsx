"use client";

import { motion, useReducedMotion } from "framer-motion";

type TopAppBarProps = {
  onOpenOnboarding?: () => void;
};

export default function TopAppBar({ onOpenOnboarding }: TopAppBarProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
      className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-saturate-150"
    >
      <div className="flex items-center gap-3">
        <button className="btn" aria-label="Open navigation menu">
          ☰
        </button>
        <div className="flex items-center gap-2">
          <div aria-hidden="true" className="h-8 w-8 rounded-xl bg-white/90" />
          <span className="font-semibold text-white">Rayon Sports</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" aria-label="Notifications">
          🔔
        </button>
        <button className="btn" aria-label="Search">
          🔍
        </button>
        <button className="btn" aria-label="Switch language">
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
