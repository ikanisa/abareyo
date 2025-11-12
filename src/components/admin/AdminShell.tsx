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
};

const NavItems = ({ activeHref }: { activeHref: string }) => {
  const { t } = useAdminLocale();
  const { isEnabled } = useAdminFeatureFlags();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
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
                'flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-500/70',
                'border border-dashed border-white/5 bg-slate-950/50',
              )}
            >
              <span>{label}</span>
              <Badge variant="outline" className="border-amber-400/30 text-[10px] uppercase tracking-wide text-amber-200">
                {t('admin.shell.nav.disabled', 'Off')}
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
              'group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
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

const ShellInner = ({ user, environment, children }: AdminShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { locale, setLocale, loading: localeLoading, t } = useAdminLocale();
  const activeHref = useMemo(() => {
    if (!pathname) {
      return '/admin';
    }
    const match = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    return match?.href ?? '/admin';
  }, [pathname]);

  const deniedMessages = useMemo(
    () => ({
      orders: t(
        'admin.shell.denied.orders',
        'Order management requires elevated access. Ask an administrator to enable it.',
      ),
      'match-ops': t(
        'admin.shell.denied.matchOps',
        'Match operations require the match:update permission. Request the role before retrying.',
      ),
      translations: t(
        'admin.shell.denied.translations',
        'The translations console requires translation:view access. Contact localization support.',
      ),
      membership: t(
        'admin.shell.denied.membership',
        'Membership insights require membership:member:view access. Request approval from an admin.',
      ),
      fundraising: t(
        'admin.shell.denied.fundraising',
        'Fundraising data is limited to fundraising:donation:view. Ask finance ops for access.',
      ),
      reports: t('admin.shell.denied.reports', 'Reports require reports:view permission. Request the analytics role.'),
    }),
    [t],
  );

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

    toast({
      title: t('admin.shell.denied.title', 'Access denied'),
      description:
        deniedMessages[denied] ??
        t('admin.shell.denied.fallback', 'You do not have permission to open that section.'),
      variant: 'destructive',
    });

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('denied');
    const next = params.toString();
    const current = pathname || '/admin';
    router.replace(next ? `${current}?${next}` : current);
  }, [deniedMessages, pathname, router, searchParams, t, toast]);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      <aside className="relative hidden w-72 flex-col border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur-xl md:flex">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
            {t('admin.shell.brand', 'Rayon Admin')}
          </Link>
          <Badge variant="outline" className="bg-white/5 text-xs uppercase tracking-wide">
            {environment}
          </Badge>
        </div>
        <NavItems activeHref={activeHref} />
        <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
          <div className="font-semibold text-slate-100">{t('admin.shell.account.signedIn', 'Signed in')}</div>
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
      <div className="relative z-[1] flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white md:hidden"
                  aria-label={t('admin.shell.nav.toggleLabel', 'Toggle navigation')}
                >
                  <Menu className="h-4 w-4" />
                  {t('admin.shell.nav.menuButton', 'Menu')}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] border-white/10 bg-slate-950/95 text-slate-100">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-lg font-semibold text-white">
                    {t('admin.shell.nav.sheetTitle', 'Navigation')}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <NavItems activeHref={activeHref} />
                </div>
              </SheetContent>
            </Sheet>
            <input
              type="search"
              placeholder={t('admin.shell.search.placeholder', 'Search operations…')}
              className="hidden w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0 md:block"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
              <span className="uppercase tracking-wide">
                {t('admin.shell.language.label', 'Language')}
              </span>
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
              {t('admin.shell.quickActions', 'Quick actions')}
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              {t('admin.shell.account.signOut', 'Sign out')}
            </Button>
          </div>
        </header>
        <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
          <div className="relative z-[1] space-y-6">{children}</div>
        </main>
      </div>
      <AdminToastViewport />
    </div>
  );
};

export const AdminShell = ({ user, environment = 'dev', children, featureFlags }: AdminShellProps) => (
  <AdminLocaleProvider>
    <AdminFeatureFlagsProvider initialFlags={featureFlags}>
      <ShellInner user={user} environment={environment}>
        {children}
      </ShellInner>
    </AdminFeatureFlagsProvider>
  </AdminLocaleProvider>
);
