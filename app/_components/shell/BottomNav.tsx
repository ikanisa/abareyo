"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { clientConfig } from "@/config/client";
import { recordNavigationEvent } from "@/lib/observability";

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
  const router = useRouter();
  const telemetryEndpoint = clientConfig.telemetryEndpoint;
  const prefetchedRoutes = useRef<Set<string>>(new Set());
  const prefix = localePrefix ?? pathname?.match(LOCALE_PREFIX)?.[0] ?? "";
  const locale = prefix ? prefix.replace(/^\//, "").split("/")[0] ?? null : null;
  const derivedActive = activePath ?? (pathname ? pathname.replace(LOCALE_PREFIX, "") || "/" : "/");

  const navItems = useMemo(
    () =>
      items.map((item) => {
        const resolvedHref = `${prefix}${item.href}`.replace(/\/+$/, "") || item.href;
        return { ...item, resolvedHref };
      }),
    [prefix],
  );

  useEffect(() => {
    navItems.forEach((item) => {
      const target = item.resolvedHref || item.href;
      if (!target.startsWith("/")) {
        return;
      }
      if (prefetchedRoutes.current.has(target)) {
        return;
      }
      prefetchedRoutes.current.add(target);
      try {
        void router.prefetch(target);
      } catch {
        prefetchedRoutes.current.delete(target);
      }
    });
  }, [navItems, router]);

  const handleNavSelect = useCallback(
    (label: string, destination: string) => {
      void recordNavigationEvent(
        {
          source: "bottom-nav",
          destination,
          label,
          locale,
        },
        telemetryEndpoint,
      );
    },
    [locale, telemetryEndpoint],
  );

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/40 pb-2 backdrop-blur-xl shadow-[0_-16px_40px_rgba(0,0,0,0.45)]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <ul className="grid grid-cols-5 gap-1 px-3 pt-2">
        {navItems.map((item) => {
          const href = item.resolvedHref || item.href;
          const isActive = derivedActive === item.href || derivedActive.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={href}
                onClick={() => handleNavSelect(item.label, href)}
                className={clsx(
                  "flex h-12 flex-col items-center justify-center rounded-xl px-2 text-sm font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
                aria-current={isActive ? "page" : undefined}
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
