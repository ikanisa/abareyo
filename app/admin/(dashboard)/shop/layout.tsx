import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { label: 'Products', href: '/admin/shop' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Promotions', href: '/admin/shop/promotions' },
];

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="glass-card flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 font-medium transition hover:bg-white/20"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
