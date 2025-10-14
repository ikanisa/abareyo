export default function Loading() {
  return (
    <div className="card" aria-busy="true">
      <div className="animate-pulse h-6 w-40 bg-white/10 rounded mb-2" />
      <div className="animate-pulse h-4 w-24 bg-white/10 rounded" />
    </div>
  );
}
