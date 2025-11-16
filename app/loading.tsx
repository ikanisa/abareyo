import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 bg-slate-800" />
          <Skeleton className="h-8 w-56 bg-slate-800" />
          <Skeleton className="h-4 w-72 bg-slate-800" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-slate-900 bg-slate-900/80 p-4">
              <Skeleton className="h-3 w-24 bg-slate-800" />
              <Skeleton className="h-6 w-20 bg-slate-800" />
              <Skeleton className="h-3 w-32 bg-slate-800" />
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-xl border border-slate-900 bg-slate-900/80 p-4">
          <Skeleton className="h-5 w-36 bg-slate-800" />
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-4 w-full bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
