'use client';

import { ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AdminLocaleProvider, useAdminLocale } from '@/providers/admin-locale-provider';

const NAV_ITEMS: Array<{ key: string; fallback: string; href: string }> = [
  { key: 'admin.nav.overview', fallback: 'Overview', href: '/admin' },
  { key: 'admin.nav.match_ops', fallback: 'Match Ops', href: '/admin/match-ops' },
  { key: 'admin.nav.orders', fallback: 'Orders & Payments', href: '/admin/orders' },
  { key: 'admin.nav.membership', fallback: 'Membership', href: '/admin/membership' },
  { key: 'admin.nav.shop', fallback: 'Shop', href: '/admin/shop' },
  { key: 'admin.nav.fundraising', fallback: 'Fundraising', href: '/admin/fundraising' },
  { key: 'admin.nav.community', fallback: 'Community', href: '/admin/community' },
  { key: 'admin.nav.content', fallback: 'Content', href: '/admin/content' },
  { key: 'admin.nav.translations', fallback: 'Translations', href: '/admin/translations' },
  { key: 'admin.nav.sms', fallback: 'SMS Console', href: '/admin/sms' },
  { key: 'admin.nav.ussd', fallback: 'USSD Templates', href: '/admin/ussd' },
  { key: 'admin.nav.users', fallback: 'Users', href: '/admin/users' },
  { key: 'admin.nav.admin', fallback: 'Admin', href: '/admin/settings' },
  { key: 'admin.nav.reports', fallback: 'Reports', href: '/admin/reports' },
];

export type AdminShellProps = {
  user: {
    displayName: string;
    email: string;
    roles: string[];
  };
  environment?: string;
  children: ReactNode;
};

const ShellInner = ({ user, environment, children }: AdminShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { locale, setLocale, loading: localeLoading, t } = useAdminLocale();
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-72 flex-col border-r border-white/5 bg-slate-950/70 px-4 py-6 md:flex">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
            Rayon Admin
          </Link>
          <Badge variant="outline" className="bg-white/5 text-xs uppercase tracking-wide">
            {environment}
          </Badge>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm transition-colors hover:bg-primary/10 hover:text-primary',
                  isActive ? 'bg-primary text-primary-foreground shadow-lg' : 'text-slate-300',
                )}
              >
                {t(item.key, item.fallback)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
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
      <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <header className="flex items-center justify-between border-b border-white/5 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white md:hidden">
              Menu
            </Button>
            <input
              type="search"
              placeholder="Search ops..."
              className="hidden w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0 md:block"
            />
          </div>
          <div className="flex items-center gap-2">
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
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AdminShell = ({ user, environment = 'dev', children }: AdminShellProps) => (
  <AdminLocaleProvider>
    <ShellInner user={user} environment={environment}>
      {children}
    </ShellInner>
  </AdminLocaleProvider>
);
