import clsx from "clsx";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  /**
   * Optional class name applied to the outer wrapper. This is used by
   * immersive pages (shop, matches) to tweak padding without duplicating the
   * base gradient + typography container.
   */
  className?: string;
  /**
   * Optional class name applied to the `<main>` element. Enables downstream
   * routes to adjust spacing while keeping a consistent shell.
   */
  mainClassName?: string;
};

export default function PageShell({
  children,
  className,
  mainClassName,
}: PageShellProps) {
  return (
    <div className={clsx("min-h-screen bg-rs-gradient text-white pb-16", className)}>
      <main className={clsx("max-w-md mx-auto p-3 space-y-6", mainClassName)}>{children}</main>
    </div>
  );
}
