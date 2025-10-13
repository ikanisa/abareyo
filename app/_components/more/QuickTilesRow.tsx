"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, HeartHandshake, ShoppingBag, Ticket, Users, Wallet2 } from "lucide-react";

import type { QuickTile, QuickTileIcon } from "@/app/_data/more";
import { cn } from "@/lib/utils";

const tileGradients: Record<QuickTile["accent"], string> = {
  blue: "from-sky-500/70 to-blue-500/80",
  green: "from-emerald-400/70 to-green-500/80",
  yellow: "from-amber-300/80 to-orange-400/80",
  pink: "from-rose-400/80 to-pink-500/80",
  teal: "from-teal-400/80 to-cyan-500/80",
  purple: "from-violet-400/70 to-indigo-500/80",
};

const tileIcons: Record<QuickTileIcon, LucideIcon> = {
  wallet: Wallet2,
  tickets: Ticket,
  shop: ShoppingBag,
  community: Users,
  fundraising: HeartHandshake,
  events: CalendarDays,
};

export type QuickTilesRowProps = {
  tiles: QuickTile[];
  onSelect: (tile: QuickTile) => void;
};

const QuickTilesRowComponent = ({ tiles, onSelect }: QuickTilesRowProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {tiles.map((tile) => {
        const Icon = tileIcons[tile.icon] ?? Wallet2;
        return (
          <motion.button
            key={tile.id}
            type="button"
            onClick={() => onSelect(tile)}
            className={cn(
              "tile group relative flex min-h-[96px] flex-col justify-between rounded-3xl p-4 text-left text-white transition",
              "shadow-lg",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "bg-gradient-to-br",
              tileGradients[tile.accent],
            )}
            aria-label={tile.ariaLabel}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 1.05 }}
            transition={reduceMotion ? undefined : { duration: 0.2, ease: "easeOut" }}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold">{tile.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export const QuickTilesRow = memo(QuickTilesRowComponent);

