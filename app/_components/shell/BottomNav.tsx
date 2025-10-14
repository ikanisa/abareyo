"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavProps = {
  /**
   * Locale prefix extracted by the container (e.g. `/en`). When provided, it
   * is preprended to every link to keep navigation scoped to the active locale.
   */
  localePrefix?: string;
  /**
   * Bare pathname (without locale prefix) used to determine the active tab.
   * Falls back to the current pathname when omitted so direct usage remains
   * compatible.
   */
  activePath?: string;
};

const LOCALE_PREFIX = /^\/(en|fr|rw)(?=\/|$)/;

const items = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Tickets", href: "/tickets" },
  { label: "Shop", href: "/shop" },
  { label: "More", href: "/more" },
];

export default function BottomNav({ localePrefix, activePath }: BottomNavProps) {
  const pathname = usePathname();
  const derivedLocale = localePrefix ?? pathname?.match(LOCALE_PREFIX)?.[0] ?? "";
  const derivedActive = activePath
    ?? (() => {
      if (!pathname) return "/";
      return pathname.replace(LOCALE_PREFIX, "") || "/";
    })();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const href = `${derivedLocale}${item.href}`.replace(/\/+$/, "");
          const isActive = derivedActive === item.href;
          return (
            <li key={item.href}>
              <Link
                href={href || item.href}
                className={`flex w-full flex-col items-center py-2 text-xs text-white/80 transition ${
                  isActive ? "font-semibold text-white" : "hover:text-white"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
