"use client";

type ErrorProps = {
  error: Error;
};

export default function Error({ error }: ErrorProps) {
  return (
    <div className="card text-center">
      <div className="text-white/90 font-semibold">Couldn’t load matches</div>
      <div className="muted text-xs">{error.message}</div>
      <a className="btn mt-2" href="/matches">
        Retry
      </a>
    </div>
  );
}
