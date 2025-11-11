'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegments,
} from 'next/navigation';
import {
  BarChart3,
  ChevronDown,
  FileText,
  Flag,
  Gift,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageSquare,
  PanelLeft,
  PanelRightOpen,
  Search as SearchIcon,
  Settings,
  ShoppingBag,
  Ticket,
  UserCog,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { AdminLocaleProvider, useAdminLocale } from '@/providers/admin-locale-provider';
import {
  AdminFeatureFlagsProvider,
  type AdminFeatureFlagSnapshot,
  type AdminModuleKey,
  useAdminFeatureFlags,
} from '@/providers/admin-feature-flags-provider';
import { ADMIN_NAV_ITEMS } from '@/config/admin-nav';
import { AdminToastViewport } from '@/components/admin/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminSearch } from '@/services/admin/search';

const NAV_ICON_MAP: Record<AdminModuleKey, LucideIcon> = {
  overview: LayoutDashboard,
  matchOps: Flag,
  tickets: Ticket,
  shop: ShoppingBag,
  services: LifeBuoy,
  rewards: Gift,
  community: Users,
  content: FileText,
  ussdSms: MessageSquare,
  users: UserCog,
  admin: Settings,
  reports: BarChart3,
};

const QUICK_LINK_MODULES: AdminModuleKey[] = ['overview', 'matchOps', 'tickets', 'services'];
const SIDEBAR_STORAGE_KEY = 'admin-shell:sidebar-collapsed';

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

const NavItems = ({ activeHref, isCollapsed }: { activeHref: string; isCollapsed: boolean }) => {
  const { t } = useAdminLocale();
  const { isEnabled } = useAdminFeatureFlags();

  return (
    <nav className={cn('flex flex-1 flex-col gap-1 overflow-y-auto', isCollapsed && 'items-center')}>
      {ADMIN_NAV_ITEMS.map((item) => {
        const enabled = isEnabled(item.module);
        const isActive = activeHref === item.href;
        const label = t(item.key, item.fallback);
        const Icon = NAV_ICON_MAP[item.module] ?? LayoutDashboard;

        if (!enabled) {
          const disabledContent = (
            <div
              key={item.href}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border border-dashed border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-slate-500/70',
                isCollapsed && 'w-12 justify-center px-2 py-3',
              )}
            >
              <Icon className={cn('h-4 w-4', isCollapsed ? 'h-5 w-5' : 'text-slate-500/80')} aria-hidden />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  <Badge variant="outline" className="border-amber-400/30 text-[10px] uppercase tracking-wide text-amber-200">
                    Off
                  </Badge>
                </>
              )}
            </div>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={150}>
                <TooltipTrigger asChild>{disabledContent}</TooltipTrigger>
                <TooltipContent side="right" align="center" className="max-w-xs text-xs">
                  <p className="font-medium text-white">{label}</p>
                  <p className="text-amber-200">Module is disabled</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return disabledContent;
        }

        const linkContent = (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'text-slate-300 hover:bg-primary/10 hover:text-primary',
              isCollapsed && 'w-12 justify-center px-2 py-3 text-base',
            )}
          >
            <Icon className={cn('h-4 w-4', isCollapsed && 'h-5 w-5')} aria-hidden />
            {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
          </Link>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={item.href} delayDuration={150}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right" align="center" className="max-w-xs text-xs">
                <p className="font-medium text-white">{label}</p>
                {item.description ? <p className="text-slate-300/80">{item.description}</p> : null}
              </TooltipContent>
            </Tooltip>
          );
        }

        return linkContent;
      })}
    </nav>
  );
};

const formatSegmentLabel = (segment: string) =>
  segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const AdminSearchCommand = ({ onNavigate }: { onNavigate?: () => void }) => {
  const router = useRouter();
  const { t } = useAdminLocale();
  const [open, setOpen] = useState(false);
  const { query, results, loading, error, setQuery, clear } = useAdminSearch({ debounceMs: 200, minLength: 2 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    clear();
  }, [clear]);

  const handleSelect = useCallback(
    (href: string) => {
      closePalette();
      onNavigate?.();
      router.push(href);
    },
    [closePalette, onNavigate, router],
  );

  const placeholder = t('admin.search.placeholder', 'Search operations…');

  const emptyMessage = useMemo(() => {
    if (!query.trim()) {
      return t('admin.search.prompt', 'Type to search across admin modules.');
    }
    if (loading) {
      return t('admin.search.loading', 'Searching modules…');
    }
    if (error) {
      return t('admin.search.error', 'Search failed. Try again.');
    }
    return t('admin.search.empty', 'No matching modules found.');
  }, [error, loading, query, t]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-72 items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-primary/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
        aria-label={placeholder}
      >
        <span className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4 opacity-70" aria-hidden />
          <span className="truncate">{placeholder}</span>
        </span>
        <kbd className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">⌘K</kbd>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden text-slate-300 hover:text-white"
        onClick={() => setOpen(true)}
        aria-label={placeholder}
      >
        <SearchIcon className="h-5 w-5" aria-hidden />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closePalette();
          } else {
            setOpen(true);
          }
        }}
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {results.length > 0 && !loading ? (
            <CommandGroup heading={t('admin.search.results', 'Modules')}>
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`${result.title} ${result.href}`}
                  onSelect={() => handleSelect(result.href)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{result.title}</span>
                    <span className="text-xs text-slate-300/80">{result.description ?? result.href}</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] uppercase text-primary">
                    {result.module}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {loading ? (
            <CommandGroup heading={t('admin.search.status', 'Status')}>
              <CommandItem value="loading" disabled>
                {t('admin.search.loading', 'Searching modules…')}
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
};

const ShellInner = ({ user, environment, children }: AdminShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const segments = useSelectedLayoutSegments();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { locale, setLocale, loading: localeLoading, t } = useAdminLocale();

  const navIndex = useMemo(() => {
    const map = new Map<string, (typeof ADMIN_NAV_ITEMS)[number]>();
    ADMIN_NAV_ITEMS.forEach((item) => {
      map.set(item.href, item);
    });
    return map;
  }, []);

  const activeHref = useMemo(() => {
    if (!pathname) {
      return '/admin';
    }
    const sorted = [...ADMIN_NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
    const match = sorted.find((item) => pathname.startsWith(item.href));
    return match?.href ?? '/admin';
  }, [pathname]);

  const navMatch = useMemo(() => navIndex.get(activeHref) ?? null, [activeHref, navIndex]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; href: string | null; description?: string }> = [];
    const adminItem = navIndex.get('/admin');
    crumbs.push({
      label: t('admin.breadcrumb.root', 'Admin'),
      href: segments.length > 0 ? '/admin' : null,
      description: adminItem?.description,
    });

    let currentPath = '/admin';
    segments.forEach((segment, index) => {
      currentPath = `${currentPath}/${segment}`.replace(/\/+/g, '/');
      const item = navIndex.get(currentPath);
      const label = item ? t(item.key, item.fallback) : formatSegmentLabel(segment);
      crumbs.push({
        label,
        href: index === segments.length - 1 ? null : currentPath,
        description: item?.description,
      });
    });

    return crumbs;
  }, [navIndex, segments, t]);

  const sectionTitle = navMatch ? t(navMatch.key, navMatch.fallback) : breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Admin';
  const sectionDescription = navMatch?.description ?? breadcrumbs[breadcrumbs.length - 1]?.description ?? null;

  const quickLinks = useMemo(
    () => ADMIN_NAV_ITEMS.filter((item) => QUICK_LINK_MODULES.includes(item.module)),
    [],
  );

  const userInitials = useMemo(() => {
    const parts = user.displayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }, [user.displayName, user.email]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored) {
      setSidebarCollapsed(stored === '1');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? '1' : '0');
  }, [isSidebarCollapsed]);

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
      <aside
        className={cn(
          'relative hidden flex-col border-r border-white/10 bg-slate-950/70 py-6 backdrop-blur-xl transition-all duration-200 md:flex',
          isSidebarCollapsed ? 'w-20 px-2' : 'w-72 px-4',
        )}
      >
        <div
          className={cn(
            'mb-6 flex items-center gap-3',
            isSidebarCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Link href="/admin" className={cn('flex items-center gap-3 text-primary', isSidebarCollapsed && 'justify-center')}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-lg font-bold text-primary">
              RY
            </span>
            {!isSidebarCollapsed && (
              <div className="leading-tight">
                <p className="text-lg font-bold tracking-tight text-primary">Rayon Admin</p>
                <p className="text-xs text-slate-400">Operations console</p>
              </div>
            )}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {!isSidebarCollapsed ? (
              <Badge variant="outline" className="bg-white/5 text-xs uppercase tracking-wide">
                {environment}
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-white"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <NavItems activeHref={activeHref} isCollapsed={isSidebarCollapsed} />
        {!isSidebarCollapsed ? (
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
        ) : (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <div className="mt-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
                {userInitials}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="max-w-xs text-xs">
              <p className="font-medium text-white">{user.displayName}</p>
              <p className="text-slate-300/80">{user.email}</p>
              {user.roles.length > 0 ? (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{user.roles.join(', ')}</p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        )}
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
                  <NavItems activeHref={activeHref} isCollapsed={false} />
                </div>
              </SheetContent>
            </Sheet>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden text-slate-300 hover:text-white md:inline-flex"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <AdminSearchCommand
              onNavigate={() => {
                setMobileNavOpen(false);
              }}
            />
          </div>
          <div className="flex items-center gap-3">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden items-center gap-2 text-slate-300 hover:text-white md:flex">
                  {t('admin.quick_links.label', 'Quick links')}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px] border border-white/10 bg-slate-950/95 text-slate-100 backdrop-blur-xl">
                {quickLinks.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    className="flex flex-col items-start gap-1"
                    onSelect={(event) => {
                      event.preventDefault();
                      router.push(item.href);
                    }}
                  >
                    <span className="text-sm font-medium text-white">{t(item.key, item.fallback)}</span>
                    {item.description ? (
                      <span className="text-xs text-slate-300/80">{item.description}</span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem disabled className="text-xs text-slate-500">
                  {t('admin.quick_links.helper', 'Need more? Collapse or expand the sidebar to browse all modules.')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
          <div className="relative z-[1] space-y-6">
            <div className="flex flex-col gap-4">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={`${crumb.href ?? 'current'}-${crumb.label}`}>
                    {index > 0 ? <span className="text-slate-600">/</span> : null}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-200">{crumb.label}</span>
                    )}
                  </Fragment>
                ))}
              </nav>
              <div>
                <h1 className="text-2xl font-semibold text-white">{sectionTitle}</h1>
                {sectionDescription ? (
                  <p className="mt-1 text-sm text-slate-300">{sectionDescription}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-6">{children}</div>
          </div>
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
