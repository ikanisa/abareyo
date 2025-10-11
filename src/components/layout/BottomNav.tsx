"use client";

import { Home, Calendar, Ticket, ShoppingBag, Users, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Calendar, labelKey: "nav.matches", path: "/matches" },
  { icon: Ticket, labelKey: "nav.tickets", path: "/tickets" },
  { icon: ShoppingBag, labelKey: "nav.shop", path: "/shop" },
  { icon: Users, labelKey: "nav.community", path: "/community" },
  { icon: MoreHorizontal, labelKey: "nav.more", path: "/more" },
];

export const BottomNav = () => {
  const pathname = usePathname();
  const bare = (pathname || '/').replace(/^\/(en|fr|rw)(?=\/|$)/, '') || '/';
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="glass-card rounded-t-3xl border-t-2 border-primary/20">
        <div className="grid grid-cols-6 gap-1 px-2 py-3">
          {navItems.map((item) => {
            const isActive =
              bare === item.path || (item.path !== "/" && bare.startsWith(`${item.path}/`));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-glow")} />
                <span className="text-[10px] font-medium">{t(item.labelKey, item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
