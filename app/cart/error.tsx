"use client";

import Link from 'next/link';

const CartError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Cart temporarily unavailable</h1>
        <p className="text-white/80">
          We couldn&apos;t refresh your items. Try again or continue browsing the shop to add more Rayon merch.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry cart
          </button>
          <Link href="/shop" className="btn">
            Back to shop
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default CartError;
