import { Skeleton } from "@/components/ui/skeleton";

const WalletLoading = () => (
  <div className="space-y-4 p-4">
    <div className="card space-y-3">
      <Skeleton className="h-6 w-40 bg-white/15" />
      <Skeleton className="h-4 w-56 bg-white/10" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`wallet-skeleton-${index}`} className="space-y-2 rounded-2xl bg-white/5 p-3">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-6 w-full bg-white/15" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 bg-white/10" />
              <Skeleton className="h-4 w-24 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="card space-y-3">
      <Skeleton className="h-6 w-32 bg-white/15" />
      <Skeleton className="h-4 w-48 bg-white/10" />
      <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
    </div>
  </div>
);

export default WalletLoading;
