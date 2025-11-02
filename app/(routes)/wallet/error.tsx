"use client";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function WalletError({ error, reset }: ErrorProps) {
  return (
    <div className="card space-y-3 text-center text-white">
      <div className="text-lg font-semibold">Couldn&apos;t load wallet</div>
      <p className="text-sm text-white/70">{error.message || 'We ran into an issue fetching your passes.'}</p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <a className="btn" href="/wallet/offline">
          View offline tips
        </a>
      </div>
    </div>
  );
}
