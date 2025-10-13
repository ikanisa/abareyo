const MatchesLoading = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="glass h-36 animate-pulse rounded-3xl" aria-hidden />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass h-48 animate-pulse rounded-3xl" aria-hidden />
        ))}
      </div>
    </div>
  </div>
);

export default MatchesLoading;
