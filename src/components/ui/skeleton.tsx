import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted/40", className)}
      style={{ animationDuration: "var(--motion-duration-deliberate)" }}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 animate-skeleton bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
    </div>
  );
}

export { Skeleton };
