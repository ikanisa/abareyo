"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Tickets", href: "/tickets" },
  { label: "Shop", href: "/shop" },
  { label: "More", href: "/more" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const classes = `block w-full py-2 text-center text-xs ${
            isActive ? "font-semibold text-white" : "text-white/80"
          }`;
          return (
            <li key={item.href}>
              <Link href={item.href} className={classes} aria-current={isActive ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
