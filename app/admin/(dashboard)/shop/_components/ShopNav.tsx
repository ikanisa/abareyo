'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/shop', label: 'Overview' },
  { href: '/admin/shop/products', label: 'Catalog' },
  { href: '/admin/shop/orders', label: 'Orders' },
  { href: '/admin/shop/promos', label: 'Promos' },
];

export const ShopNav = () => {
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
                ? 'bg-accent text-accent-foreground shadow-lg'
                : 'text-slate-300 hover:bg-accent/20 hover:text-accent-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};
