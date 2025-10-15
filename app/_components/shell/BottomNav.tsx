"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BagIcon, BallIcon, DotsIcon, HomeIcon, TicketIcon } from "@/app/_components/home/LiquidScreens";

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

type IconProps = { className?: string };

type NavItem = {
  label: string;
  href: string;
  icon: (props: IconProps) => JSX.Element;
};

const LOCALE_PREFIX = /^\/(en|fr|rw)(?=\/|$)/;

const items: NavItem[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Matches", href: "/matches", icon: BallIcon },
  { label: "Tickets", href: "/tickets", icon: TicketIcon },
  { label: "Shop", href: "/shop", icon: BagIcon },
  { label: "More", href: "/more", icon: DotsIcon },
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
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <nav
        className="pointer-events-auto grid h-14 w-full max-w-sm grid-cols-5 items-stretch gap-1 rounded-full border border-white/25 bg-white/20 px-1 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
        style={{ WebkitBackdropFilter: "blur(22px)" }}
      >
        {items.map((item) => {
          const href = `${derivedLocale}${item.href}`.replace(/\/+$/, "");
          const isActive = derivedActive === item.href || derivedActive.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={href || item.href}
              className={clsx(
                "group relative flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[13px] font-semibold text-white/90 transition sm:px-2 sm:text-sm",
                isActive
                  ? "bg-white/30 text-white shadow-inner shadow-white/20"
                  : "hover:bg-white/10 hover:text-white active:bg-white/15",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-5 w-5 opacity-95" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
