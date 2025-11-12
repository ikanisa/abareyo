import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

const CONTENT_WIDTH_CLASS: Record<'lg' | 'xl' | '2xl' | 'full', string> = {
  lg: 'max-w-[var(--content-width-lg)]',
  xl: 'max-w-[var(--content-width-xl)]',
  '2xl': 'max-w-[var(--content-width-2xl)]',
  full: 'max-w-none',
};

export type AdminPageShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  sidebarWidth?: string;
  contentWidth?: keyof typeof CONTENT_WIDTH_CLASS;
  className?: string;
};

export const AdminPageShell = ({
  sidebar,
  header,
  children,
  sidebarWidth = 'var(--admin-sidebar-width)',
  contentWidth = '2xl',
  className,
}: AdminPageShellProps) => (
  <div className="relative isolate min-h-screen admin-surface text-slate-100">
    <div className="pointer-events-none absolute inset-0 admin-surface-glow" aria-hidden />
    <div
      className="relative z-0 grid min-h-screen w-full grid-cols-1 lg:grid-cols-[var(--admin-sidebar-width)_1fr]"
      style={{ '--admin-sidebar-width': sidebarWidth } as CSSProperties}
    >
      <aside className="hidden border-r border-white/10 bg-[var(--admin-sidebar-surface)] px-[var(--space-5)] py-[var(--space-8)] backdrop-blur-xl lg:flex lg:flex-col">
        {sidebar}
      </aside>
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex min-h-[var(--admin-header-height)] items-center justify-between gap-[var(--space-4)] border-b border-white/10 bg-[var(--admin-header-surface)] px-[var(--space-gutter-inline)] py-[var(--space-4)] backdrop-blur-xl">
          {header}
        </header>
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 -top-12 h-24 admin-highlight blur-3xl" aria-hidden />
          <div
            className={cn(
              'relative z-10 mx-auto flex w-full flex-col gap-[var(--space-8)] px-[var(--space-gutter-inline)] py-[var(--space-8)]',
              CONTENT_WIDTH_CLASS[contentWidth],
              className,
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  </div>
);
