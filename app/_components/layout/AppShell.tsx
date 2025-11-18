"use client";

import { Activity, Gauge, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { appNavigation } from "@/app/navigation";
import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: Gauge,
  users: Users,
  activity: Activity,
  settings: Settings,
} as const;

const MobileNav = ({ pathname }: { pathname: string }) => (
  <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 px-4 py-3 md:hidden" aria-label="Primary">
    {appNavigation.primary.map((item) => {
      const Icon = iconMap[item.icon];
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
            isActive
              ? "bg-slate-800 text-slate-50"
              : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span>{item.title}</span>
        </Link>
      );
    })}
  </nav>
);

const SidebarNav = ({ pathname }: { pathname: string }) => (
  <aside className="hidden w-64 border-r border-slate-800 bg-slate-950/80 px-4 py-6 md:block">
    <div className="px-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Control Center</div>
    <nav className="mt-4 space-y-1" aria-label="Primary">
      {appNavigation.primary.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-800 text-slate-50 shadow-inner"
                : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900",
                isActive && "border-slate-700 bg-slate-800 text-slate-50",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span>{item.title}</span>
              {item.description ? (
                <span className="text-xs font-normal text-slate-400">{item.description}</span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </nav>
  </aside>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() || "/";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <SidebarNav pathname={pathname} />
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-4 md:px-6">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-400">Rayon Operations</span>
              <span className="text-xl font-bold text-slate-50">Admin workspace</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
              Minimal surface &bull; steady release channel
            </div>
          </header>
          <MobileNav pathname={pathname} />
          <main className="px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
