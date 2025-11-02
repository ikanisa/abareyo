"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Separator,
} from "@rayon/ui";
import { getBrowserClient } from "@/supabase/browser-client";
import { SessionProvider } from "@/providers/session-context";
import type { RoleGuard } from "@/auth/roles";
import { BadgeCheck, Gift, LayoutDashboard, LogOut, ShoppingBag, Ticket, Users, Workflow } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  ticket: Ticket,
  workflow: Workflow,
  users: Users,
  gift: Gift,
  "shopping-bag": ShoppingBag,
};

const getInitials = (email: string | null) => email?.slice(0, 2).toUpperCase() ?? "RA";

export const LayoutShell = ({
  session,
  nav,
  children,
}: {
  session: Session;
  nav: RoleGuard[];
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const client = getBrowserClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (!client) {
      return;
    }
    setSigningOut(true);
    await client.auth.signOut();
    window.location.href = "/login";
  }, [client]);

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-background/95">
        <aside className="hidden w-64 border-r border-border/40 bg-background/80 px-6 py-8 md:flex md:flex-col">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
            <BadgeCheck className="size-5 text-primary" /> Rayon Admin
          </div>
          <nav className="flex-1 space-y-1">
            {nav.map((item) => {
              const Icon = iconMap[item.icon] ?? LayoutDashboard;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href || "/"}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-gradient-hero text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            className="mt-auto justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut className="size-4" />
            {signingOut ? "Signing out" : "Sign out"}
          </Button>
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div>
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="text-base font-semibold">{session.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {getInitials(session.user.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="px-4 py-6 md:px-8">
            <div className="mb-6 md:hidden">
              <Separator className="bg-border/60" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {nav.map((item) => {
                  const Icon = iconMap[item.icon] ?? LayoutDashboard;
                  return (
                    <Link
                      key={`mobile-${item.href}`}
                      href={item.href || "/"}
                      className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-card/80 p-4 text-sm font-medium shadow-lg shadow-black/10"
                    >
                      <Icon className="size-4 text-primary" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
};
