"use client";

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { motion } from "framer-motion";

import { gradientTokens, motionTokens, typographyTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/motion-provider";
import { cn } from "@/lib/utils";

type GlassTileProps = Omit<
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
  title: string;
  description?: string;
  gradient?: keyof typeof gradientTokens;
};

const MotionButton = motion.button;

export const GlassTile = forwardRef<HTMLButtonElement, GlassTileProps>(
  ({ title, description, gradient = "accent", className, children, type = "button", ...props }, ref) => {
    const { reducedMotion } = useMotionPreference();
    const style = {
      "--tile-gradient": gradientTokens[gradient] ?? gradientTokens.accent,
    } as CSSProperties;

    return (
      <MotionButton
        ref={ref}
        className={cn(
          "group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-glass backdrop-blur-sm transition", 
          className
        )}
        style={style}
        whileHover={
          reducedMotion
            ? undefined
            : { scale: 1.015, transition: { duration: motionTokens.toSeconds(motionTokens.duration.fast) } }
        }
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        type={type}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[image:var(--tile-gradient)] opacity-60" />
        <div className="flex min-h-[84px] flex-1 flex-col justify-center">
          <span
            className="text-base font-semibold text-white drop-shadow"
            style={{ fontFamily: typographyTokens.fontFamily.display }}
          >
            {title}
          </span>
          {description ? (
            <span className="mt-1 text-sm text-white/70" style={{ fontFamily: typographyTokens.fontFamily.sans }}>
              {description}
            </span>
          ) : null}
        </div>
        {children ? <div className="text-white/80">{children}</div> : null}
      </MotionButton>
    );
  }
);

GlassTile.displayName = "GlassTile";
