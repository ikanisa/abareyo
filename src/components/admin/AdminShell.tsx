'use client';
import type { ReactNode } from "react";

import { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AdminLocaleProvider, useAdminLocale } from '@/providers/admin-locale-provider';
import {
  AdminFeatureFlagsProvider,
  type AdminFeatureFlagSnapshot,
  type AdminModuleKey,
  useAdminFeatureFlags,
} from '@/providers/admin-feature-flags-provider';
import { AdminToastViewport } from '@/components/admin/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell';

const NAV_ITEMS: Array<{
  key: string;
  fallback: string;
  href: string;
  module: AdminModuleKey;
  badge?: string;
  secondaryHref?: string;
}> = [
  { key: 'admin.nav.overview', fallback: 'Overview', href: '/admin', module: 'overview' },
  { key: 'admin.nav.match_ops', fallback: 'Match Ops', href: '/admin/match-ops', module: 'matchOps' },
  { key: 'admin.nav.tickets', fallback: 'Tickets', href: '/admin/tickets', module: 'tickets' },
  { key: 'admin.nav.shop', fallback: 'Shop', href: '/admin/shop', module: 'shop' },
  { key: 'admin.nav.services', fallback: 'Services', href: '/admin/services', module: 'services' },
  { key: 'admin.nav.rewards', fallback: 'Rewards', href: '/admin/rewards', module: 'rewards' },
  { key: 'admin.nav.community', fallback: 'Community', href: '/admin/community', module: 'community' },
  { key: 'admin.nav.content', fallback: 'Content', href: '/admin/content', module: 'content' },
  {
    key: 'admin.nav.ussd_sms',
    fallback: 'USSD / SMS',
    href: '/admin/sms',
    module: 'ussdSms',
    secondaryHref: '/admin/ussd',
  },
  { key: 'admin.nav.users', fallback: 'Users', href: '/admin/users', module: 'users' },
  { key: 'admin.nav.admin', fallback: 'Admin', href: '/admin/settings', module: 'admin' },
  { key: 'admin.nav.reports', fallback: 'Reports', href: '/admin/reports', module: 'reports' },
];

export type AdminShellProps = {
  user: {
    displayName: string;
    email: string;
    roles: string[];
  };
  environment?: string;
  children: ReactNode;
  featureFlags?: AdminFeatureFlagSnapshot[];
  secondaryPanel?: ReactNode;
};

const NavItems = ({ activeHref }: { activeHref: string }) => {
  const { t } = useAdminLocale();
  const { isEnabled } = useAdminFeatureFlags();

  return (
    <nav className="flex flex-1 flex-col gap-[var(--space-1)] overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const enabled = isEnabled(item.module);
        const isActive = activeHref === item.href;
        const label = t(item.key, item.fallback);
        if (!enabled) {
          return (
            <button
              key={item.href}
              type="button"
              aria-disabled
              className={cn(
                'flex items-center justify-between rounded-xl px-[var(--space-3)] py-[var(--space-2)] text-sm text-slate-500/70',
                'border border-dashed border-white/5 bg-slate-950/50',
              )}
            >
              <span>{label}</span>
              <Badge variant="outline" className="border-amber-400/30 text-[10px] uppercase tracking-wide text-amber-200">
                Off
              </Badge>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'group flex items-center justify-between rounded-xl px-[var(--space-3)] py-[var(--space-2)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'text-slate-300 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <span>{label}</span>
            {item.badge ? (
              <Badge variant="outline" className="border-white/10 bg-white/10 text-[10px] uppercase text-white">
                {item.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
};

const DefaultUtilityRail = ({
  locale,
  setLocale,
  localeLoading,
  onLogout,
  isLoggingOut,
}: {
  locale: string;
  setLocale: (next: string) => void;
  localeLoading: boolean;
  onLogout: () => void;
  isLoggingOut: boolean;
}) => (
  <div className="flex h-full flex-col gap-shell-stack">
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace tools</p>
      <div>
        <p className="text-sm text-slate-300/80">Switch the admin console language.</p>
        <div className="mt-3 flex overflow-hidden rounded-full border border-white/10 bg-slate-950/40">
          {(['en', 'rw'] as const).map((code) => {
            const isActive = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                disabled={localeLoading}
                className={cn(
                  'flex-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                )}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>
    </section>
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
        <p className="text-sm text-slate-300/80">Access shortcuts configured for your role.</p>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-between gap-2 border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      >
        Quick actions
        <ChevronDown className="h-4 w-4" />
      </Button>
    </section>
    <div className="mt-auto space-y-2">
      <Button
        variant="outline"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="w-full border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      >
        Sign out
      </Button>
    </div>
  </div>
);

const ShellInner = ({ user, environment, children, secondaryPanel }: AdminShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { locale, setLocale, loading: localeLoading } = useAdminLocale();
  const activeHref = useMemo(() => {
    if (!pathname) {
      return '/admin';
    }
    const match = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    return match?.href ?? '/admin';
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api'}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to log out admin session', error);
    } finally {
      setIsLoggingOut(false);
      router.push('/admin/login');
      router.refresh();
    }
  }, [isLoggingOut, router]);

  useEffect(() => {
    const denied = searchParams?.get('denied');
    if (!denied) {
      return;
    }

    const messages: Record<string, string> = {
      orders: 'You lack permission to view order management. Contact an admin to request access.',
      'match-ops': 'Match operations require the match:update permission.',
      translations: 'Translations console requires the translation:view permission.',
      membership: 'Membership console requires the membership:member:view permission.',
      fundraising: 'Fundraising console requires the fundraising:donation:view permission.',
      reports: 'Reports require the reports:view permission.',
    };

    toast({
      title: 'Access denied',
      description: messages[denied] ?? 'You do not have permission to access that section.',
      variant: 'destructive',
    });

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('denied');
    const next = params.toString();
    const current = pathname || '/admin';
    router.replace(next ? `${current}?${next}` : current);
  }, [pathname, router, searchParams, toast]);

  return (
    <div
      className={cn(
        'relative grid min-h-screen grid-cols-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100',
        'md:grid-cols-admin-shell',
        'lg:grid-cols-admin-shell-rail',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      <aside className="relative hidden h-full flex-col border-r border-white/10 bg-slate-950/70 px-shell-gutter py-shell-stack backdrop-blur-xl md:flex">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
            Rayon Admin
          </Link>
          {environment ? (
            <Badge variant="outline" className="bg-white/5 text-xs uppercase tracking-wide">
              {environment}
            </Badge>
          ) : null}
        </div>
        <div className="mt-shell-stack flex-1 overflow-hidden">
          <NavItems activeHref={activeHref} />
        </div>
        <div className="mt-shell-stack rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
          <div className="font-semibold text-slate-100">Signed in</div>
          <div>{user.displayName}</div>
          <div className="truncate text-slate-400">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role} variant="secondary" className="bg-primary/15 text-primary">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </aside>
      <div className="relative z-[1] flex min-h-screen flex-col bg-slate-950/40 backdrop-blur-xl md:border-l md:border-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-shell-gutter py-shell-utility md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[260px] border-white/10 bg-slate-950/95 p-shell-stack text-slate-100"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-lg font-semibold text-white">Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-shell-stack">
                <NavItems activeHref={activeHref} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            {environment ? (
              <Badge variant="outline" className="bg-white/5 text-[10px] uppercase tracking-wide">
                {environment}
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Sign out
            </Button>
          </div>
        </div>
        <div className="hidden items-center justify-between border-b border-white/10 px-shell-gutter py-shell-utility md:flex lg:border-b-0 lg:pb-0">
          <input
            type="search"
            placeholder="Search ops…"
            className="w-full max-w-[22rem] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0"
          />
          <div className="hidden items-center gap-3 lg:hidden">
            <div className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
              <span className="uppercase tracking-wide">Lang</span>
              <div className="flex overflow-hidden rounded-full border border-white/10">
                {(['en', 'rw'] as const).map((code) => {
                  const isActive = locale === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLocale(code)}
                      disabled={localeLoading}
                      className={cn(
                        'px-2 py-1 text-[11px] font-semibold uppercase transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-transparent text-slate-300 hover:bg-white/10',
                      )}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hidden items-center gap-2 text-slate-300 hover:text-white md:flex">
              Quick actions
              <ChevronDown className="h-4 w-4" />
            </Button>
  const sidebarContent = (
    <div className="flex flex-1 flex-col gap-[var(--space-6)]">
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
          Rayon Admin
        </Link>
        <Badge variant="outline" className="bg-white/5 text-xs uppercase tracking-wide">
          {environment}
        </Badge>
      </div>
      <NavItems activeHref={activeHref} />
      <div className="rounded-xl border border-white/5 bg-white/5 p-[var(--space-3)] text-xs text-slate-300">
        <div className="font-semibold text-slate-100">Signed in</div>
        <div>{user.displayName}</div>
        <div className="truncate text-slate-400">{user.email}</div>
        <div className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-1)]">
          {user.roles.map((role) => (
            <Badge key={role} variant="secondary" className="bg-primary/15 text-primary">
              {role}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <>
      <div className="flex flex-1 items-center gap-[var(--space-3)]">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-[var(--space-2)] text-slate-300 hover:text-white lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] border-white/10 bg-slate-950/95 text-slate-100">
            <SheetHeader className="text-left">
              <SheetTitle className="text-lg font-semibold text-white">Navigation</SheetTitle>
            </SheetHeader>
            <div className="mt-[var(--space-6)]">
              <NavItems activeHref={activeHref} />
            </div>
          </SheetContent>
        </Sheet>
        <input
          type="search"
          placeholder="Search ops…"
          className="hidden w-[22rem] rounded-lg border border-white/10 bg-white/5 px-[var(--space-3)] py-[var(--space-2)] text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0 lg:block"
        />
      </div>
      <div className="flex items-center gap-[var(--space-3)]">
        <div className="hidden items-center gap-[var(--space-1)] text-xs text-slate-400 lg:flex">
          <span className="uppercase tracking-wide">Lang</span>
          <div className="flex overflow-hidden rounded-full border border-white/10">
            {(['en', 'rw'] as const).map((code) => {
              const isActive = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  disabled={localeLoading}
                  className={cn(
                    'px-[var(--space-2)] py-[0.35rem] text-[11px] font-semibold uppercase transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-slate-300 hover:bg-white/10',
                  )}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>
        <main className="relative flex-1 overflow-y-auto px-shell-gutter py-shell-stack">
          <div className="absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
          <div className="relative z-[1] mx-auto flex w-full max-w-shell-content flex-col gap-shell-stack">{children}</div>
        </main>
      </div>
      <aside className="relative hidden h-full border-l border-white/10 bg-slate-950/50 px-shell-gutter py-shell-stack backdrop-blur-xl lg:flex">
        <div className="flex h-full w-full flex-col overflow-hidden">
          {secondaryPanel ? (
            <div className="flex-1 overflow-y-auto">{secondaryPanel}</div>
          ) : (
            <DefaultUtilityRail
              locale={locale}
              setLocale={setLocale}
              localeLoading={localeLoading}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />
          )}
        </div>
      </aside>
        <Button
          variant="ghost"
          size="sm"
          className="hidden items-center gap-[var(--space-2)] text-slate-300 hover:text-white lg:flex"
        >
          Quick actions
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
        >
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      <AdminPageShell sidebar={sidebarContent} header={headerContent}>
        {children}
      </AdminPageShell>
      <AdminToastViewport />
    </>
  );
};

export const AdminShell = ({
  user,
  environment = 'dev',
  children,
  featureFlags,
  secondaryPanel,
}: AdminShellProps) => (
  <AdminLocaleProvider>
    <AdminFeatureFlagsProvider initialFlags={featureFlags}>
      <ShellInner user={user} environment={environment} secondaryPanel={secondaryPanel}>
        {children}
      </ShellInner>
    </AdminFeatureFlagsProvider>
  </AdminLocaleProvider>
);
