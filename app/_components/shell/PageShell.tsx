"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

const PageShell = ({ children, mainClassName }: PageShellProps) => (
  <div className="min-h-screen bg-rs-gradient text-white">
    <main
      className={cn(
        "mx-auto max-w-md space-y-6 px-3 py-5 md:max-w-5xl md:px-4 md:py-8",
        mainClassName,
      )}
    >
      {children}
    </main>
  </div>
);

export default PageShell;
