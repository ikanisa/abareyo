"use client";

import Link from 'next/link';

const MatchesError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-3 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Match centre is offline</h1>
        <p className="text-white/80">
          We couldn&apos;t load the latest fixtures. Refresh or retry in a moment, then jump back into Tickets or Shop.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry sync
          </button>
          <Link href="/tickets" className="btn">
            Go to tickets
          </Link>
          <Link href="/shop" className="btn">
            Visit shop
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default MatchesError;
