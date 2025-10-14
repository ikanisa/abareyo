"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Landmark, ShieldCheck, Sparkles, Wallet2 } from "lucide-react";

const tiles = [
  { icon: "insurance", label: "Insurance", href: "/services#insurance", description: "Get matchday perks" },
  { icon: "sacco", label: "SACCO Deposit", href: "/services#sacco", description: "Earn double fan points" },
  { icon: "bank", label: "Bank Offers", href: "/services#bank", description: "Unlock partner promos" },
] as const;

const iconMap: Record<(typeof tiles)[number]["icon"], LucideIcon> = {
  insurance: ShieldCheck,
  sacco: Wallet2,
  bank: Landmark,
};

const PartnerTiles = () => {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-3 gap-3" role="list">
      {tiles.map((tile) => {
        const Icon = iconMap[tile.icon] ?? Sparkles;

        return (
          <motion.button
            key={tile.href}
            type="button"
            role="listitem"
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            whileHover={reduceMotion ? undefined : { translateY: -3 }}
            transition={reduceMotion ? undefined : { type: "spring", stiffness: 260, damping: 22 }}
            className="tile flex-col gap-1 text-center text-sm font-semibold leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            onClick={() => router.push(tile.href)}
            aria-label={`${tile.label} — ${tile.description}`}
          >
          <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="block text-xs text-white/80">{tile.label}</span>
        </motion.button>
        );
      })}
    </div>
  );
};

export default PartnerTiles;
