"use client";

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { motion } from "framer-motion";

import { gradientTokens, motionTokens, typographyTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/motion-provider";
import { cn } from "@/lib/utils";

type GlassButtonTone = "primary" | "accent" | "ghost";

type GlassButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
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
  tone?: GlassButtonTone;
};

const toneMap: Record<GlassButtonTone, keyof typeof gradientTokens> = {
  primary: "hero",
  accent: "accent",
  ghost: "surface",
};

const MotionButton = motion.button;

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, tone = "primary", children, type = "button", ...props }, ref) => {
    const { reducedMotion } = useMotionPreference();
    const gradient = gradientTokens[toneMap[tone]] ?? gradientTokens.hero;
    const style = {
      "--button-gradient": gradient,
    } as CSSProperties;

    const transition = {
      duration: motionTokens.toSeconds(motionTokens.duration.fast),
      ease: motionTokens.easing.standard,
    };

    return (
      <MotionButton
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white shadow-glass",
          tone === "ghost" ? "bg-white/10 text-white" : "bg-white/20",
          className
        )}
        style={style}
        whileHover={reducedMotion ? undefined : { scale: 1.02, transition }}
        whileTap={reducedMotion ? undefined : { scale: 0.97, transition }}
        type={type}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[image:var(--button-gradient)] opacity-80" />
        <span style={{ fontFamily: typographyTokens.fontFamily.display }}>{children}</span>
      </MotionButton>
    );
  }
);

GlassButton.displayName = "GlassButton";
