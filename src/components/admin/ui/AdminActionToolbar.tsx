import * as React from "react";

import { cn } from "@/lib/utils";

import { adminTheme } from "./theme";

export interface AdminActionToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3;
  align?: "start" | "stretch";
}

const gridColumnsClass = (columns: 1 | 2 | 3) => {
  if (columns === 1) return "md:grid-cols-1";
  if (columns === 3) return "md:grid-cols-3";
  return "md:grid-cols-2";
};

const AdminActionToolbarRoot = React.forwardRef<HTMLDivElement, AdminActionToolbarProps>(
  ({ columns = 2, align = "stretch", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4",
          gridColumnsClass(columns),
          align === "stretch" ? "items-stretch" : "items-start",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

AdminActionToolbarRoot.displayName = "AdminActionToolbar";

export interface AdminActionToolbarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "surface" | "muted";
}

const AdminActionToolbarSection = React.forwardRef<HTMLDivElement, AdminActionToolbarSectionProps>(
  ({ title, description, actions, footer, variant = "surface", className, children, ...props }, ref) => {
    const surfaceClass = variant === "muted" ? adminTheme.surfaces.muted : adminTheme.surfaces.base;

    return (
      <section
        ref={ref}
        className={cn(
          adminTheme.radii.md,
          surfaceClass,
          "flex flex-col gap-4 p-5",
          "focus-within:ring-1 focus-within:ring-sky-400/60",
          className,
        )}
        {...props}
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className={cn("text-sm font-semibold", adminTheme.text.primary)}>{title}</h3>
              {description ? <p className={cn("text-xs", adminTheme.text.muted)}>{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </header>
        {children ? <div className="space-y-3 text-sm text-slate-200">{children}</div> : null}
        {footer ? (
          <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-white/5 pt-3">
            {footer}
          </div>
        ) : null}
      </section>
    );
  },
);

AdminActionToolbarSection.displayName = "AdminActionToolbar.Section";

export const AdminActionToolbar = Object.assign(AdminActionToolbarRoot, {
  Section: AdminActionToolbarSection,
});
