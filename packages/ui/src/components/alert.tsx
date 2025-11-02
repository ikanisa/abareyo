import * as React from "react";

import { cn } from "../lib/cn";

const variantStyles: Record<string, string> = {
  info: "border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  danger: "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  neutral: "border-border/60 bg-muted/40 text-muted-foreground",
};

type AlertVariant = keyof typeof variantStyles;

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant = "neutral", ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    className={cn(
      "flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm",
      variantStyles[variant] ?? variantStyles.neutral,
      className,
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm/relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
