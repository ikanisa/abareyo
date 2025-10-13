const PdpLoading = () => {
  return (
    <div className="min-h-screen bg-rs-gradient pb-24 text-white">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-8">
        <div className="h-10 w-24 rounded-full bg-white/20" />
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white/10">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
        </div>
        <section className="space-y-3">
          <div className="h-6 w-3/4 rounded-full bg-white/15" />
          <div className="h-4 w-1/2 rounded-full bg-white/10" />
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-white/15" />
            <div className="h-5 w-16 rounded-full bg-white/15" />
          </div>
        </section>
        <div className="h-12 w-full rounded-2xl bg-white/10" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-11 rounded-2xl bg-white/10" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-12 flex-1 rounded-2xl bg-white/10" />
          <div className="h-12 flex-1 rounded-2xl bg-white/15" />
        </div>
        <div className="h-36 rounded-3xl bg-white/10" />
        <div className="h-32 rounded-3xl bg-white/10" />
      </main>
    </div>
  );
};

export default PdpLoading;
