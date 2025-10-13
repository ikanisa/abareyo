"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Crown } from "lucide-react";

import type { Membership } from "@/app/_data/more";

const tierDescriptions: Record<Membership["tier"], string> = {
  Guest: "Unlock fandom perks by becoming an official member.",
  Fan: "You're connected. Upgrade to Gold for matchday luxuries.",
  Gold: "Elite access unlocked. Enjoy every premium benefit.",
};

export type MembershipWidgetProps = {
  membership: Membership;
  onUpgrade?: () => void;
};

export function MembershipWidget({ membership, onUpgrade }: MembershipWidgetProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();

  const handleUpgrade = () => {
    if (membership.tier === "Gold") {
      router.push("/membership");
      return;
    }
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    router.push("/membership/upgrade");
  };

  return (
    <motion.section
      className="card flex h-full flex-col justify-between gap-4 bg-white/10 text-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-labelledby="membership-heading"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/20 p-3">
          <Crown className="h-6 w-6" aria-hidden />
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
          Expires {membership.expiresOn}
        </span>
      </header>
      <div>
        <p className="text-sm text-white/70">Membership</p>
        <h3 id="membership-heading" className="text-2xl font-semibold">
          {membership.tier} tier
        </h3>
        <p className="mt-2 text-sm text-white/80">{tierDescriptions[membership.tier]}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-white/70">
        {membership.benefits.map((benefit) => (
          <span key={benefit} className="rounded-full bg-white/10 px-3 py-1">
            {benefit}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        className="btn-primary inline-flex items-center justify-center gap-1 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label={membership.tier === "Gold" ? "Manage membership" : "Upgrade membership"}
      >
        {membership.tier === "Gold" ? "Manage membership" : "Upgrade"}
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </button>
    </motion.section>
  );
}
