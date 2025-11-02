"use client";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function NewsError({ error, reset }: ErrorProps) {
  return (
    <div className="card space-y-3 text-center text-white">
      <div className="text-lg font-semibold">Couldn&apos;t load latest stories</div>
      <p className="text-sm text-white/70">{error.message || 'Something went wrong while fetching articles.'}</p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Retry
        </button>
        <a className="btn" href="/news/offline">
          Use offline feed
        </a>
      </div>
    </div>
  );
}
