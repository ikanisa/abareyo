import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-semibold transition-colors duration-fast ease-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/85",
        accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent/85",
        outline: "border-border bg-transparent text-foreground hover:bg-muted/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
