'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException } from '@/lib/observability';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg">Something went wrong</CardTitle>
            <CardDescription className="text-slate-400">
              The minimal workspace ran into an issue. Try again or return to the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
            <Button variant="secondary" className="bg-slate-800 text-slate-50 hover:bg-slate-700" onClick={() => reset()}>
              Try again
            </Button>
            <Button asChild>
              <a href="/">Go to dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
