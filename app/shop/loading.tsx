const ShopLoading = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="glass h-40 animate-pulse rounded-3xl" aria-hidden />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="glass h-64 animate-pulse rounded-3xl" aria-hidden />
        ))}
      </div>
    </div>
  </div>
);

export default ShopLoading;
