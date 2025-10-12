"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { id: "home", label: "Home", href: "/", icon: "🏠" },
  { id: "tickets", label: "Tickets", href: "/tickets", icon: "🎟️" },
  { id: "wallet", label: "Wallet", href: "/wallet", icon: "💳" },
  { id: "shop", label: "Shop", href: "/shop", icon: "🛍️" },
  { id: "more", label: "More", href: "/more", icon: "⋯" },
] as const;

const linkBaseClasses =
  "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium tracking-wide transition";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-4 left-0 right-0 z-40 mx-auto w-[min(520px,92%)] rounded-3xl bg-black/30 p-2 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`${linkBaseClasses} ${
                isActive
                  ? "bg-white text-black"
                  : "text-white/80 hover:bg-white/20 focus-visible:bg-white/25"
              }`}
            >
              <span aria-hidden="true" className="text-lg">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
