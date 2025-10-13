import Link from 'next/link';

const RewardsNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Rewards history not found</h1>
        <p className="text-white/80">
          We couldn&apos;t find reward data for this supporter. Visit the dashboard or start earning by grabbing tickets and merch.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/more" className="btn-primary">
            Back to dashboard
          </Link>
          <Link href="/tickets" className="btn">
            Buy tickets
          </Link>
          <Link href="/shop" className="btn">
            Shop now
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default RewardsNotFound;
