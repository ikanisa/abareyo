"use client";

import Link from 'next/link';

const RewardsError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Rewards unavailable</h1>
        <p className="text-white/80">
          We couldn&apos;t load your rewards ledger. Retry in a moment or explore tickets and shop to continue earning points.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry rewards
          </button>
          <Link href="/tickets" className="btn">
            Tickets
          </Link>
          <Link href="/shop" className="btn">
            Shop
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default RewardsError;
