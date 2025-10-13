const RewardsLoading = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="glass h-32 animate-pulse rounded-3xl" aria-hidden />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="glass h-40 animate-pulse rounded-3xl" aria-hidden />
      ))}
    </div>
  </div>
);

export default RewardsLoading;
