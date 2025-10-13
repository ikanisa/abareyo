"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";

import type { Fundraiser } from "@/app/_data/more";

const currencyFormatter = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

export type FundraiserWidgetProps = {
  fundraiser: Fundraiser;
  onDonate?: () => void;
};

export function FundraiserWidget({ fundraiser, onDonate }: FundraiserWidgetProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const progressValue = Math.min(Math.max(fundraiser.progress, 0), 1);
  const progressPercent = Math.round(progressValue * 100);

  const handleDonate = () => {
    if (onDonate) {
      onDonate();
      return;
    }
    router.push("/fundraising");
  };

  return (
    <motion.section
      className="card break-words whitespace-normal break-words whitespace-normal flex h-full flex-col justify-between gap-4 bg-white/10 text-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-labelledby="fundraiser-heading"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/20 p-3">
          <HeartHandshake className="h-6 w-6" aria-hidden />
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
          Goal {currencyFormatter.format(fundraiser.goal)}
        </span>
      </header>
      <div>
        <p className="text-sm text-white/70">Active fundraiser</p>
        <h3 id="fundraiser-heading" className="text-xl font-semibold">
          {fundraiser.title}
        </h3>
        {fundraiser.description ? (
          <p className="mt-2 text-sm text-white/80">{fundraiser.description}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/70">
          <span>{progressPercent}% funded</span>
          <span>RWF {currencyFormatter.format(Math.round(progressValue * fundraiser.goal)).replace("RWF", "")}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-emerald-400"
            initial={prefersReducedMotion ? undefined : { width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Fundraiser progress"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleDonate}
        className="btn-primary inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label="Donate to fundraiser"
      >
        Donate now
      </button>
    </motion.section>
  );
}
