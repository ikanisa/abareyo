import * as React from "react";

import { cn } from "../utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = ({ className, style, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted/40", className)}
      style={{ animationDuration: "var(--motion-duration-deliberate)", ...style }}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 animate-skeleton bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
    </div>
  );
};
