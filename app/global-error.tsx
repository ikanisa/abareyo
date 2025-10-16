'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 py-12 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800/60 bg-neutral-900/70 p-8 text-center shadow-xl">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-neutral-400">
            Our team has been notified. You can try again or head back to the previous page.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
