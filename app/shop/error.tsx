"use client";

import Link from 'next/link';

const ShopError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Shop is warming up</h1>
        <p className="text-white/80">
          We couldn&apos;t load the latest catalog. Retry, or explore tickets and services while we reconnect to Supabase.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry loading
          </button>
          <Link href="/tickets" className="btn">
            Buy tickets
          </Link>
          <Link href="/services" className="btn">
            Partner services
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ShopError;
