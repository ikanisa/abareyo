"use client";

import Link from 'next/link';

const ServicesError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Partner services unavailable</h1>
        <p className="text-white/80">
          We&apos;re syncing with our insurance and SACCO partners. Retry shortly or jump into rewards while we finish.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry
          </button>
          <Link href="/more/rewards" className="btn">
            View rewards
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ServicesError;
