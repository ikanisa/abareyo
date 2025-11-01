"use client";

import { useId } from "react";

import { Switch } from "@/components/ui/switch";
import { useMotionPreference } from "@/providers/motion-provider";

export const MotionToggle = () => {
  const { reducedMotion, setReducedMotion } = useMotionPreference();
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-white">
          Reduce Motion
        </label>
        <p className="text-xs text-white/60">Toggle animations and easing for accessibility.</p>
      </div>
      <Switch id={id} checked={reducedMotion} onCheckedChange={(value) => setReducedMotion(Boolean(value))} />
    </div>
  );
};
