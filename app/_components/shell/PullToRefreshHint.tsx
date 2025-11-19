"use client";

import clsx from "clsx";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type PullToRefreshHintProps = {
  onRefresh?: () => void;
  className?: string;
  refreshing?: boolean;
  label?: string;
};

export function PullToRefreshHint({
  onRefresh,
  className,
  refreshing = false,
  label = "Pull down to refresh live data",
}: PullToRefreshHintProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/80 shadow-sm backdrop-blur-md",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <RefreshCw className={clsx("h-4 w-4", refreshing && "animate-spin")} aria-hidden />
        <span>{refreshing ? "Refreshing…" : label}</span>
      </div>
      {onRefresh ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          onClick={onRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      ) : null}
    </div>
  );
}
