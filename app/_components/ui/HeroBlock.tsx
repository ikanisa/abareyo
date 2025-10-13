"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface HeroBlockProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  kicker?: string;
  actions?: ReactNode;
  className?: string;
}

const HeroBlock = ({ title, subtitle, eyebrow, kicker, actions, className }: HeroBlockProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={cn(
        "card relative overflow-hidden px-6 py-8 text-white",
        "bg-gradient-to-br from-white/15 via-white/10 to-white/5",
        className,
      )}
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-blue-500/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-60px] top-6 h-48 w-48 rounded-full bg-amber-400/35 blur-3xl"
      />
      <div className="relative z-10 flex flex-col gap-5">
        {eyebrow ? (
          <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="max-w-xl text-sm text-white/80 md:text-base">{subtitle}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        {kicker ? <p className="text-xs uppercase tracking-wide text-white/60">{kicker}</p> : null}
      </div>
    </motion.section>
  );
};

export default HeroBlock;
