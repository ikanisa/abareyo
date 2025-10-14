"use client";

import Link from 'next/link';

const TicketsError = ({ reset }: { reset: () => void }) => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Ticket desk is busy</h1>
        <p className="text-white/80">
          Something went wrong while loading fixtures. Try again or browse the shop while we stabilise the connection.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Retry fetch
          </button>
          <Link href="/shop" className="btn">
            Visit shop
          </Link>
          <Link href="/" className="btn">
            Back home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default TicketsError;
