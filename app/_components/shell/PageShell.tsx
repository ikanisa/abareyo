import type { ReactNode } from "react";

const shellClass = "min-h-screen bg-rs-gradient text-white pb-20 pt-6";
const baseContentClass = "mx-auto flex w-full max-w-md flex-col gap-6 px-4";

type PageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export default function PageShell({ children, mainClassName }: PageShellProps) {
  const contentClass = mainClassName
    ? `${baseContentClass} ${mainClassName}`
    : baseContentClass;
  return (
    <div className={shellClass}>
      <main className={contentClass}>{children}</main>
    </div>
  );
}
