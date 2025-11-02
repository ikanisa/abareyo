import { Skeleton } from "@/components/ui/skeleton";

const NewsLoading = () => (
  <div className="space-y-6 p-4">
    <div className="card space-y-3">
      <Skeleton className="h-6 w-48 bg-white/15" />
      <Skeleton className="h-4 w-64 bg-white/10" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`news-headline-${index}`} className="space-y-3 rounded-2xl bg-white/5 p-3">
            <Skeleton className="h-40 w-full rounded-2xl bg-white/10" />
            <Skeleton className="h-5 w-3/4 bg-white/15" />
            <Skeleton className="h-4 w-2/3 bg-white/10" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14 bg-white/10" />
              <Skeleton className="h-4 w-16 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="card space-y-3">
      <Skeleton className="h-6 w-40 bg-white/15" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`news-list-${index}`} className="h-4 w-full bg-white/10" />
        ))}
      </div>
    </div>
  </div>
);

export default NewsLoading;
