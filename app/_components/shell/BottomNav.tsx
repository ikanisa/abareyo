"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/providers/i18n-provider";

const items = [
  { labelKey: "nav.home", fallback: "Home", href: "/" },
  { labelKey: "nav.matches", fallback: "Matches", href: "/matches" },
  { labelKey: "nav.tickets", fallback: "Tickets", href: "/tickets" },
  { labelKey: "nav.shop", fallback: "Shop", href: "/shop" },
  { labelKey: "nav.more", fallback: "More", href: "/more" },
] as const;

const buildHref = (localePrefix: string, href: string) => {
  if (!localePrefix) {
    return href;
  }
  if (href === "/") {
    return localePrefix;
  }
  return `${localePrefix}${href}`;
};

type BottomNavProps = {
  localePrefix?: string;
  activePath?: string;
};

export default function BottomNav({ localePrefix = "", activePath }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const currentPath = activePath ?? (() => {
    if (!pathname) return "/";
    if (!localePrefix) return pathname || "/";
    return pathname.replace(localePrefix, "") || "/";
  })();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/30 backdrop-blur-xl"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const href = buildHref(localePrefix, item.href);
          const isActive =
            currentPath === item.href ||
            (item.href !== "/" && currentPath.startsWith(`${item.href}/`));
          const label = t(item.labelKey, item.fallback);
          return (
            <li key={item.href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
