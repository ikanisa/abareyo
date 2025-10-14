'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/tickets', label: 'Overview' },
  { href: '/admin/tickets/orders', label: 'Orders' },
  { href: '/admin/tickets/passes', label: 'Passes' },
  { href: '/admin/tickets/scan', label: 'Scan Dashboard' },
];

export const TicketsNav = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-slate-300 hover:bg-primary/10 hover:text-primary',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};
