'use client';

import type { ReactNode } from 'react';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AdminLocaleProvider, useAdminLocale } from '@/providers/admin-locale-provider';
import {
  AdminFeatureFlagsProvider,
  type AdminFeatureFlagSnapshot,
  useAdminFeatureFlags,
} from '@/providers/admin-feature-flags-provider';
import { useAdminSession } from '@/providers/admin-session-provider';
import { AdminToastViewport } from '@/components/admin/ui';
import { AdminGlobalSearch } from '@/components/admin/ui/AdminGlobalSearch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ADMIN_NAVIGATION_GROUPS,
  ADMIN_NAVIGATION_ITEMS,
  ADMIN_QUICK_ACTIONS,
  findAdminNavigationItem,
  type AdminNavigationBadge,
  type AdminNavigationItem,
  type AdminNavigationSection,
} from '@/config/admin-navigation';
import { hasAnyPermission } from '@/config/admin-rbac';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

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

type NavItemState = {
  item: AdminNavigationItem;
  modulesAvailable: boolean;
  hasAccess: boolean;
  disabledReason: 'flag' | 'permission' | null;
};

const badgeToneClassNames: Record<NonNullable<AdminNavigationBadge['tone']>, string> = {
  default: 'border-white/10 bg-white/10 text-white',
  info: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
  success: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
};

const NavigationBadge = ({ badge }: { badge?: AdminNavigationBadge }) => {
  if (!badge) {
    return null;
  }
  const toneClass = badgeToneClassNames[badge.tone ?? 'default'];
  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wide', toneClass)}>
      {badge.label}
    </Badge>
  );
};

const NavItems = ({
  states,
  activeItem,
  onNavigate,
}: {
  states: NavItemState[];
  activeItem?: AdminNavigationItem;
  onNavigate?: () => void;
}) => {
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
      {Array.from(
        states.reduce<Map<string, NavItemState[]>>((acc, state) => {
          const list = acc.get(state.item.group) ?? [];
          list.push(state);
          acc.set(state.item.group, list);
          return acc;
        }, new Map()),
      ).map(([groupKey, groupStates]) => {
        const group = ADMIN_NAVIGATION_GROUPS[groupKey as keyof typeof ADMIN_NAVIGATION_GROUPS];
        return (
          <div key={groupKey} className="flex flex-col gap-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500/70">
              {group?.label ?? groupKey}
            </p>
            {groupStates.map((state) => {
              const { item, modulesAvailable, hasAccess, disabledReason } = state;
              const isActive = activeItem?.key === item.key;

              if (!modulesAvailable) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    aria-disabled
                    className="flex items-center justify-between rounded-xl border border-dashed border-white/5 bg-slate-950/50 px-3 py-2 text-left text-sm text-slate-500/70"
                  >
                    <span>{item.fallback}</span>
                    <Badge className="border-amber-400/30 bg-amber-400/10 text-[10px] uppercase tracking-wide text-amber-100" variant="outline">
                      Off
                    </Badge>
                  </button>
                );
              }

              if (!hasAccess || disabledReason === 'permission') {
                return (
                  <button
                    key={item.href}
                    type="button"
                    aria-disabled
                    className="flex items-center justify-between rounded-xl border border-dashed border-white/5 bg-slate-950/50 px-3 py-2 text-left text-sm text-slate-500/70"
                  >
                    <span>{item.fallback}</span>
                    <Badge className="border-rose-400/40 bg-rose-500/10 text-[10px] uppercase tracking-wide text-rose-100" variant="outline">
                      Restricted
                    </Badge>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'text-slate-300 hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  <span>{item.fallback}</span>
                  <NavigationBadge badge={item.badge} />
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
};

type Breadcrumb = { label: string; href?: string };

const Breadcrumbs = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) => {
  if (!breadcrumbs.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-400">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span className="text-slate-600">/</span> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="transition-colors hover:text-primary">
                {crumb.label}
              </Link>
            ) : (
              <span className={cn('truncate', isLast ? 'text-white' : undefined)}>{crumb.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const SecondaryNavigation = ({
  sections,
  activeSectionKey,
  onSelect,
}: {
  sections: AdminNavigationSection[];
  activeSectionKey: string | null;
  onSelect: (key: string | null) => void;
}) => {
  if (!sections.length) {
    return null;
  }

  return (
    <div className="border-b border-white/10 bg-slate-950/60 px-4 py-2 backdrop-blur-xl md:px-8">
      <div className="-mx-1 flex items-center gap-1 overflow-x-auto">
        {sections.map((section) => {
          const isActive = activeSectionKey === section.key;
          return (
            <Link
              key={section.key}
              href={section.href}
              onClick={() => onSelect(section.key)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary text-primary-foreground shadow shadow-primary/30'
                  : 'text-slate-300 hover:bg-primary/10 hover:text-primary',
              )}
            >
              <span>{section.label}</span>
              {section.badge ? <NavigationBadge badge={section.badge} /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const QuickActionsMenu = () => {
  const router = useRouter();
  const { isEnabled } = useAdminFeatureFlags();
  const { permissions } = useAdminSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const actions = useMemo(() => {
    return ADMIN_QUICK_ACTIONS.filter((action) =>
      action.modules.some((module) => isEnabled(module)) && hasAnyPermission(permissions, action.permissions ?? []),
    );
  }, [isEnabled, permissions]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return actions;
    }
    return actions.filter((action) => {
      const keywords = [action.label, action.description, ...(action.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return keywords.includes(trimmed);
    });
  }, [actions, query]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery('');
    }
  }, []);

  const triggerDisabled = actions.length === 0;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={triggerDisabled}
        className="hidden items-center gap-2 text-slate-300 hover:text-white md:flex"
      >
        <Sparkles className="h-4 w-4" />
        Quick actions
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        disabled={triggerDisabled}
        className="flex items-center text-slate-300 hover:text-white md:hidden"
        aria-label="Open quick actions"
      >
        <Sparkles className="h-4 w-4" />
      </Button>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search quick actions…" />
        <CommandList>
          <CommandEmpty>No quick actions available.</CommandEmpty>
          <CommandGroup heading="Common workflows">
            {filtered.map((action) => (
              <CommandItem
                key={action.id}
                value={`${action.label} ${(action.keywords ?? []).join(' ')}`}
                onSelect={() => handleSelect(action.href)}
              >
                <action.icon className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-slate-100">{action.label}</span>
                  {action.description ? (
                    <span className="text-xs text-slate-400">{action.description}</span>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

const ShellInner = ({ user, environment, children }: AdminShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { locale, setLocale, loading: localeLoading } = useAdminLocale();
  const { isEnabled } = useAdminFeatureFlags();
  const { permissions } = useAdminSession();

  const navStates = useMemo<NavItemState[]>(() => {
    return ADMIN_NAVIGATION_ITEMS.map((item) => {
      const modulesAvailable = item.modules.some((module) => isEnabled(module));
      const hasAccess = hasAnyPermission(permissions, item.permissions ?? []);
      const disabledReason: NavItemState['disabledReason'] = modulesAvailable ? (hasAccess ? null : 'permission') : 'flag';
      return {
        item,
        modulesAvailable,
        hasAccess,
        disabledReason,
      };
    });
  }, [isEnabled, permissions]);

  const activeItem = useMemo(() => {
    if (!pathname) {
      return undefined;
    }
    return findAdminNavigationItem(pathname);
  }, [pathname]);

  const secondarySections = useMemo(() => {
    if (!activeItem?.sections) {
      return [] as AdminNavigationSection[];
    }

    return activeItem.sections.filter((section) => {
      const modulesAvailable = (section.modules ?? activeItem.modules).some((module) => isEnabled(module));
      const sectionPermissions = section.permissions ?? activeItem.permissions ?? [];
      return modulesAvailable && hasAnyPermission(permissions, sectionPermissions);
    });
  }, [activeItem, isEnabled, permissions]);

  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);

  useEffect(() => {
    const updateFromHash = () => {
      if (typeof window === 'undefined') {
        return;
      }
      const hash = window.location.hash.replace('#', '');
      setActiveSectionKey(hash || null);
    };

    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);
    return () => window.removeEventListener('hashchange', updateFromHash);
  }, [pathname]);

  const breadcrumbs = useMemo<Breadcrumb[]>(() => {
    const crumbs: Breadcrumb[] = [{ label: 'Admin', href: '/admin' }];
    if (activeItem) {
      const group = ADMIN_NAVIGATION_GROUPS[activeItem.group];
      if (group) {
        crumbs.push({ label: group.label });
      }
      crumbs.push({ label: activeItem.fallback, href: activeItem.href });
      if (activeSectionKey) {
        const section = activeItem.sections?.find((entry) => entry.key === activeSectionKey);
        if (section) {
          crumbs.push({ label: section.label, href: section.href });
        }
      }
    }
    return crumbs;
  }, [activeItem, activeSectionKey]);

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
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      <aside className="relative hidden w-72 flex-col border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur-xl md:flex">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
            Rayon Admin
          </Link>
          <Badge variant="outline" className="bg-white/5 text-xs uppercase tracking-wide">
            {environment}
          </Badge>
        </div>
        <NavItems states={navStates} activeItem={activeItem} />
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
      <div className="relative z-[1] flex min-h-screen flex-1 flex-col">
        <header className="border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="inline-flex items-center gap-2 text-slate-300 hover:text-white md:hidden"
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
                    <div className="mt-6">
                      <NavItems
                        states={navStates}
                        activeItem={activeItem}
                        onNavigate={() => setMobileNavOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
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
                <QuickActionsMenu />
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <AdminGlobalSearch className="w-full" />
              </div>
            </div>
          </div>
        </header>
        <SecondaryNavigation
          sections={secondarySections}
          activeSectionKey={activeSectionKey}
          onSelect={setActiveSectionKey}
        />
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
