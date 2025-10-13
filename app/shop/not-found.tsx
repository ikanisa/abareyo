import Link from 'next/link';

const ShopNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Collection unavailable</h1>
        <p className="text-white/80">
          The category you requested is empty. Browse the featured drops below or jump back to the home experience.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">
            Shop all merch
          </Link>
          <Link href="/" className="btn">
            Back to home
          </Link>
          <Link href="/more/rewards" className="btn">
            View rewards
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ShopNotFound;
