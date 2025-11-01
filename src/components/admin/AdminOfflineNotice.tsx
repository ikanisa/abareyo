"use client";

import { useEffect, useRef } from "react";

export type AdminOfflineNoticeProps = { message: string };

export const AdminOfflineNotice = ({ message }: AdminOfflineNoticeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-200">
      <div
        ref={containerRef}
        className="max-w-md space-y-4 text-center outline-none"
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
      >
        <h1 className="text-2xl font-semibold">Admin dashboard unavailable</h1>
        <p className="text-sm text-slate-400">{message}</p>
        <p className="text-xs text-slate-500">
          Set NEXT_PUBLIC_BACKEND_URL and ensure the admin API is reachable, then retry.
        </p>
        <p className="text-xs text-slate-500">
          Need help?{' '}
          <a className="text-primary underline" href="mailto:ops@gikundiro.com">
            Contact the ops team
          </a>{' '}
          or check the internal status page.
        </p>
      </div>
    </div>
  );
};

export default AdminOfflineNotice;
