import { cn } from "../lib/cn";

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-skeleton rounded-xl bg-muted", className)} {...props} />
);

export { Skeleton };
