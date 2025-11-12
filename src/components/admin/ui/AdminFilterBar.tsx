import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { adminTheme } from "./theme";

type AdminFilterSegment = {
  label?: React.ReactNode;
  content: React.ReactNode;
};

export interface AdminFilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: AdminFilterSegment[];
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export const AdminFilterBar = React.forwardRef<HTMLDivElement, AdminFilterBarProps>(
  ({ segments, actions, isLoading = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          adminTheme.radii.sm,
          adminTheme.surfaces.inset,
          "flex flex-wrap items-center gap-3 px-4 py-3",
          className,
        )}
        {...props}
      >
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            {segment.label ? (
              <span className={cn("text-xs font-semibold uppercase tracking-wide", adminTheme.text.secondary)}>
                {segment.label}
              </span>
            ) : null}
            <div className="flex items-center gap-2 text-sm text-slate-200">{segment.content}</div>
          </div>
        ))}
        {children}
        {(isLoading || actions) && (
          <div className="ml-auto flex items-center gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" aria-hidden /> : null}
            {actions}
          </div>
        )}
      </div>
    );
  },
);

AdminFilterBar.displayName = "AdminFilterBar";
