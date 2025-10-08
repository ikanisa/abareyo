import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hero" | "accent";
}

export const GlassCard = ({ 
  children, 
  className, 
  variant = "default",
  ...props 
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass-card transition-all duration-300",
        variant === "hero" && "glow-primary",
        variant === "accent" && "glow-accent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
