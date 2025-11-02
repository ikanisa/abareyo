"use client";

import { useEffect, useRef, type ReactNode } from "react";

const shimmer = "animate-pulse bg-white/10";

const AdminViewFallback = ({ title, description }: { title: string; description?: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen px-4 pb-24 pt-8 outline-none"
      role="status"
      aria-live="polite"
      tabIndex={-1}
      aria-busy="true"
    >
      <div className="space-y-2 pb-6">
        <div className="h-8 w-2/3 rounded-full bg-white/10" aria-hidden />
        <div className="h-4 w-full max-w-md rounded-full bg-white/5" aria-hidden />
        <h1 className="sr-only">{title}</h1>
        {description ? <p className="sr-only">{description}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`skeleton-${index}`} className={`h-28 rounded-2xl ${shimmer}`} />
        ))}
      </div>
    </div>
  );
};

export default AdminViewFallback;
