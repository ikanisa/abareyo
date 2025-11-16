'use client';

import clsx from "clsx";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

export default function PageShell({ children, className, mainClassName }: PageShellProps) {
  return (
    <div className={clsx("min-h-screen bg-slate-950 text-slate-100", className)}>
      <main
        className={clsx(
          "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
