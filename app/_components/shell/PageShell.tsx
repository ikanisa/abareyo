import clsx from 'clsx';
import type { ReactNode } from 'react';

type PageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

export default function PageShell({ children, className, mainClassName }: PageShellProps){
  return (
    <div className={clsx('min-h-screen bg-rs-gradient text-white pb-16', className)}>
      <main className={clsx('max-w-md mx-auto p-3 space-y-6', mainClassName)}>{children}</main>
    </div>
  );
}
