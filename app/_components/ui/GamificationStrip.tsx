"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Brain, CheckCircle2, Target } from "lucide-react";

import type { GamificationTileWithProgress } from "@/lib/api/home";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/utils";

const iconMap: Record<GamificationTileWithProgress["icon"], LucideIcon> = {
  check: CheckCircle2,
  brain: Brain,
  target: Target,
};

const toneClass: Record<GamificationTileWithProgress["progress"]["status"], string> = {
  available: "text-white/80",
  completed: "text-emerald-200",
};

const skeletonItems = Array.from({ length: 3 }, (_, index) => index);

type GamificationStripProps = {
  tiles: GamificationTileWithProgress[];
  isLoading?: boolean;
  isOffline?: boolean;
  onSelect?: (tile: GamificationTileWithProgress) => void;
};

const progressWidth = (tile: GamificationTileWithProgress) => {
  if (tile.progress.total === 0) {
    return "0%";
  }
  const ratio = Math.min(1, tile.progress.current / tile.progress.total);
  return `${Math.round(ratio * 100)}%`;
};

const GamificationStripComponent = ({ tiles, isLoading = false, isOffline = false, onSelect }: GamificationStripProps) => {
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">
        {skeletonItems.map((item) => (
          <Skeleton key={`gamification-skeleton-${item}`} className="h-[112px] w-full rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (tiles.length === 0) {
    if (isOffline) {
      return (
        <EmptyState
          title="Offline missions"
          description="We&apos;ll sync fresh challenges for you the moment your connection returns."
          icon="🛰️"
        />
      );
    }

    return (
      <EmptyState
        title="Challenges launching soon"
        description="Mini games and fan challenges will reappear here when new competitions go live."
        icon="🎮"
      />
    );
  }

  return (
    <div className="space-y-3">
      {isOffline ? (
        <div
          className="card border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80"
          role="status"
          aria-live="polite"
        >
          Offline mode — showing your saved challenges.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list">
        {tiles.map((tile) => {
          const Icon = iconMap[tile.icon];
          const tone = toneClass[tile.progress.status];

          return (
            <motion.button
              key={tile.id}
              type="button"
              role="listitem"
              aria-label={tile.ariaLabel}
              className={cn(
                "tile flex min-h-[112px] flex-col justify-between rounded-3xl p-4 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              )}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              whileHover={reduceMotion ? undefined : { translateY: -3 }}
              transition={reduceMotion ? undefined : { type: "spring", stiffness: 280, damping: 24 }}
              onClick={() => onSelect?.(tile)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="flex flex-col text-sm">
                  <span className="font-semibold text-white">{tile.label}</span>
                  <span className={cn("text-xs", tone)}>{tile.progress.label}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-white/70">
                <div className="flex items-center justify-between">
                  <span>
                    {tile.progress.current}/{tile.progress.total} complete
                  </span>
                  {tile.progress.points ? (
                    <span className="font-semibold text-white/80">{tile.progress.points} pts</span>
                  ) : null}
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={tile.progress.total}
                  aria-valuenow={tile.progress.current}
                >
                  <div className="h-full rounded-full bg-blue-400" style={{ width: progressWidth(tile) }} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const GamificationStrip = memo(GamificationStripComponent);

export default GamificationStrip;
