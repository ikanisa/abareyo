"use client";

import Link from 'next/link';

const MoreError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Dashboard unavailable</h1>
        <p className="text-white/80">
          We couldn&apos;t load your wallet and membership data. Retry or use the quick actions to continue exploring the app.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry dashboard
          </button>
          <Link href="/wallet" className="btn">
            Wallet
          </Link>
          <Link href="/shop" className="btn">
            Shop
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default MoreError;
