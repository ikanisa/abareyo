import ProductSkeleton from "./_components/ProductSkeleton";

const ShopLoading = () => {
  return (
    <div className="min-h-screen bg-rs-gradient pb-24 text-white">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-8">
        <section className="space-y-3">
          <div className="h-6 w-32 rounded-full bg-white/20" />
          <div className="h-4 w-56 rounded-full bg-white/10" />
        </section>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white/10">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
        </div>

        <section className="space-y-3">
          <div className="h-5 w-44 rounded-full bg-white/15" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-11 rounded-full bg-white/10" />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="h-5 w-36 rounded-full bg-white/15" />
          <div className="h-scroll flex gap-3 pb-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="min-w-[220px] rounded-2xl bg-white/10 p-4">
                <div className="mb-3 aspect-square w-full overflow-hidden rounded-2xl bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded-full bg-white/15" />
                  <div className="h-3 w-2/3 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="h-5 w-40 rounded-full bg-white/15" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ShopLoading;
