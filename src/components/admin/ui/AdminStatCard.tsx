import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { adminTheme } from "./theme";

type TrendTone = "positive" | "negative" | "neutral";

type AdminStatMeta = {
  label: React.ReactNode;
  value: React.ReactNode;
};

type AdminStatTrend = {
  label: React.ReactNode;
  tone?: TrendTone;
  icon?: React.ReactNode;
};

export interface AdminStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  value?: React.ReactNode;
  valueLabel?: React.ReactNode;
  stats?: AdminStatMeta[];
  trend?: AdminStatTrend | null;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  align?: "start" | "center";
  variant?: "surface" | "muted";
  children?: React.ReactNode;
}

const toneClassName: Record<TrendTone, string> = {
  positive: adminTheme.text.positive,
  negative: adminTheme.text.negative,
  neutral: adminTheme.text.secondary,
};

export const AdminStatCard = React.forwardRef<HTMLDivElement, AdminStatCardProps>(
  (
    {
      title,
      description,
      value,
      valueLabel,
      stats,
      trend,
      footer,
      icon,
      isLoading = false,
      align = "start",
      variant = "surface",
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const alignment = align === "center" ? "items-center text-center" : "items-start";
    const surfaceClass = variant === "muted" ? adminTheme.surfaces.muted : adminTheme.surfaces.base;

    return (
      <div
        ref={ref}
        className={cn(
          adminTheme.radii.md,
          surfaceClass,
          adminTheme.states.interactive,
          "relative flex flex-col gap-3 p-5",
          alignment,
          className,
        )}
        {...props}
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className={cn("space-y-1", align === "center" && "w-full")}>
            <div className={cn("text-xs font-semibold uppercase tracking-wide", adminTheme.text.secondary)}>
              {title}
            </div>
            {description ? (
              <p className={cn("text-sm", adminTheme.text.muted)}>{description}</p>
            ) : null}
          </div>
          {icon ? <div className="shrink-0 text-slate-300">{icon}</div> : null}
        </div>

        {value !== undefined ? (
          <div className="flex w-full flex-col gap-1">
            <div className={cn("text-3xl font-semibold", adminTheme.text.primary)}>
              {isLoading ? <Skeleton className="h-8 w-32" /> : value}
            </div>
            {valueLabel ? (
              <div className={cn("text-xs font-medium", adminTheme.text.subtle)}>{valueLabel}</div>
            ) : null}
          </div>
        ) : null}

        {stats && stats.length > 0 ? (
          <dl className="w-full space-y-1 text-xs">
            {stats.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-2 text-slate-400">
                <dt>{item.label}</dt>
                <dd className="font-medium text-slate-200">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {children}

        {trend?.label ? (
          <div
            className={cn(
              "mt-auto text-xs font-medium",
              toneClassName[trend.tone ?? "neutral"],
              "flex items-center gap-2",
            )}
          >
            {trend.icon ? trend.icon : null}
            <span>{trend.label}</span>
          </div>
        ) : null}

        {footer ? <div className="mt-2 w-full border-t border-white/5 pt-3 text-xs text-slate-400">{footer}</div> : null}
      </div>
    );
  },
);

AdminStatCard.displayName = "AdminStatCard";
