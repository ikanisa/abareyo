"use client";

import Link from "next/link";
import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Crown,
  HeartHandshake,
  Landmark,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  Wallet2,
} from "lucide-react";

import type { QuickActionTileWithStat } from "@/lib/api/home";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/utils";

type QuickActionTone = "neutral" | "positive" | "warning";

const tileToneClass: Record<QuickActionTone, string> = {
  neutral: "text-white/70",
  positive: "text-emerald-200",
  warning: "text-amber-200",
};

const iconMap: Record<QuickActionTileWithStat["icon"], LucideIcon> = {
  tickets: Ticket,
  membership: Crown,
  shop: ShoppingBag,
  donate: HeartHandshake,
  insurance: ShieldCheck,
  sacco: Wallet2,
  bank: Landmark,
};

const MotionLink = motion(Link);

const skeletonItems = Array.from({ length: 4 }, (_, index) => index);

export type QuickTilesProps = {
  tiles: QuickActionTileWithStat[];
  isLoading?: boolean;
  onSelect?: (tile: QuickActionTileWithStat) => void;
};

const QuickTilesComponent = ({ tiles, isLoading = false, onSelect }: QuickTilesProps) => {
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        aria-hidden="true"
      >
        {skeletonItems.map((item) => (
          <li key={`quick-tile-skeleton-${item}`} className="list-none">
            <Skeleton className="h-[108px] w-full rounded-3xl bg-white/10" />
          </li>
        ))}
      </ul>
    );
  }

  if (tiles.length === 0) {
    return (
      <EmptyState
        title="No quick actions yet"
        description="We will surface ticketing, wallet and membership shortcuts here as they become available."
        icon="⏳"
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="list">
      {tiles.map((tile) => {
        const Icon = iconMap[tile.icon] ?? Sparkles;
        const tone: QuickActionTone = tile.stat?.tone ?? "neutral";

        return (
          <li key={tile.id} className="list-none">
            <MotionLink
              href={tile.href}
              aria-label={tile.ariaLabel}
              className={cn(
                "tile group relative flex min-h-[108px] flex-col justify-between rounded-3xl p-4 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              )}
              whileHover={reduceMotion ? undefined : { translateY: -4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={reduceMotion ? undefined : { type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => onSelect?.(tile)}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <span className="block text-sm font-semibold text-white">{tile.label}</span>
                {tile.stat ? (
                  <div className="space-y-0.5 text-xs">
                    <span className={cn("block font-semibold", tileToneClass[tone])}>{tile.stat.value}</span>
                    <span className="block text-white/60">{tile.stat.label}</span>
                  </div>
                ) : null}
              </div>
            </MotionLink>
          </li>
        );
      })}
    </ul>
  );
};

const QuickTiles = memo(QuickTilesComponent);

export default QuickTiles;
