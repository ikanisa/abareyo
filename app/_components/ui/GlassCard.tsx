"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { motion } from "framer-motion";

import { gradientTokens, motionTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/motion-provider";
import { cn } from "@/lib/utils";

type GlassCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragOver"
  | "onDragEnter"
  | "onDragLeave"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
> & {
  gradient?: keyof typeof gradientTokens;
};

const MotionDiv = motion.div;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, gradient = "surface", ...props }, ref) => {
    const { reducedMotion } = useMotionPreference();
    const transition = {
      duration: motionTokens.toSeconds(motionTokens.duration.deliberate),
      ease: motionTokens.easing.standard,
    } as const;
    const dynamicStyle = {
      "--glass-gradient": gradientTokens[gradient] ?? gradientTokens.surface,
    } as CSSProperties;

    return (
      <MotionDiv
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-glass backdrop-blur-glass",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-white/0",
          className
        )}
        style={dynamicStyle}
        initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition }}
        {...props}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[image:var(--glass-gradient)] opacity-60"
        />
        <div className="relative z-10 space-y-3">{children}</div>
      </MotionDiv>
    );
  }
);

GlassCard.displayName = "GlassCard";
