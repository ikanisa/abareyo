import * as React from "react";

import { gradients } from "../tokens";
import { cn } from "../utils/cn";

export type TileVariant = "solid" | "glass" | "gradient";

export interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TileVariant;
  gradient?: keyof typeof gradients;
  interactive?: boolean;
}

export const Tile = React.forwardRef<HTMLDivElement, TileProps>(
  (
    {
      className,
      variant = "solid",
      gradient = "surface",
      interactive = false,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const gradientFill = gradients[gradient];
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-foreground",
          interactive && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
          variant === "glass" && "glass-card",
          variant === "gradient" && "text-primary-foreground shadow-glow",
          className,
        )}
        style={variant === "gradient" ? { ...style, backgroundImage: gradientFill } : style}
        {...props}
      >
        {variant === "glass" ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-white/10"
            style={{ backgroundImage: gradients.surface }}
          />
        ) : null}
        <div className="relative z-10">{children}</div>
      </div>
    );
  },
);
Tile.displayName = "Tile";
