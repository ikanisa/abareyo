"use client";

import { Home, Calendar, Ticket, ShoppingBag, Users, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavigation } from "@/app/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap = {
  home: Home,
  calendar: Calendar,
  ticket: Ticket,
  bag: ShoppingBag,
  users: Users,
  more: MoreHorizontal,
} as const;

const bottomNavItems = appNavigation.consumer.filter((item) => item.surfaces.includes('bottom-nav'));

export const BottomNav = () => {
  const pathname = usePathname();
  const bare = (pathname || '/').replace(/^\/(en|fr|rw)(?=\/|$)/, '') || '/';
  const { t } = useI18n();

  return (
    <nav
      aria-label="Fan primary navigation"
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
    >
      <div className="glass-card rounded-t-3xl border-t-2 border-primary/20">
        <div className="grid grid-cols-6 gap-1 px-2 py-3">
          {bottomNavItems.map((item) => {
            const isActive =
              bare === item.href || (item.href !== '/' && bare.startsWith(`${item.href}/`));
            const Icon = iconMap[item.icon] ?? Home;
            const label = t(item.labelKey, item.meta.title);
            const description = item.description ?? item.meta.description;

            return (
              <Tooltip key={item.id} delayDuration={150}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition-all duration-300',
                      isActive
                        ? 'scale-110 text-primary'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-glow')} aria-hidden="true" />
                    <span className="text-[10px] font-medium">{t(item.labelKey, item.labelKey)}</span>
                  </Link>
                </TooltipTrigger>
                {description ? (
                  <TooltipContent side="top" className="max-w-[220px] text-center">
                    {description}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
