export default function Skeleton() {
  return (
    <div className="card space-y-2" aria-busy="true">
      <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
    </div>
  );
}
