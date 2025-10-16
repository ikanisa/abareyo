"use client";

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type BottomNavProps = {
  localePrefix?: string;
  activePath?: string;
};

const items = [
  { label: 'Home', href: '/' },
  { label: 'Matches', href: '/matches' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'Shop', href: '/shop' },
  { label: 'More', href: '/more' },
];

const LOCALE_PREFIX = /^\/(en|fr|rw)(?=\/|$)/;

export default function BottomNav({ localePrefix, activePath }: BottomNavProps = {}) {
  const pathname = usePathname();
  const prefix = localePrefix ?? pathname?.match(LOCALE_PREFIX)?.[0] ?? '';
  const derivedActive = activePath ?? (pathname ? pathname.replace(LOCALE_PREFIX, '') || '/' : '/');

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-black/20 backdrop-blur-xl border-t border-white/10">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const href = `${prefix}${item.href}`.replace(/\/+$/, '') || item.href;
          const isActive = derivedActive === item.href || derivedActive.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={href}
                className={clsx(
                  'block w-full py-2 text-center text-xs',
                  isActive ? 'font-semibold text-white' : 'text-white/80'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
