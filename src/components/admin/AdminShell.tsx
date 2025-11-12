'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
import type { MouseEvent, ReactNode } from 'react';

import type { ReactNode } from 'react';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, Sparkles } from 'lucide-react';

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
  useAdminFeatureFlags,
} from '@/providers/admin-feature-flags-provider';
import { ADMIN_NAV_ITEMS } from '@/config/admin-nav';
import { useAdminSession } from '@/providers/admin-session-provider';
import { AdminToastViewport } from '@/components/admin/ui';
import { AdminGlobalSearch } from '@/components/admin/ui/AdminGlobalSearch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminSearch } from '@/services/admin/search';
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
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell';

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
  secondaryPanel?: ReactNode;
};

const NavItems = ({ activeHref, onSelect }: { activeHref: string; onSelect?: () => void }) => {
const NavItems = ({ activeHref, isCollapsed }: { activeHref: string; isCollapsed: boolean }) => {
const NavItemsList = ({ activeHref }: { activeHref: string }) => {
  const { t } = useAdminLocale();
  const { isEnabled } = useAdminFeatureFlags();
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
    <nav aria-label="Admin sections" className="flex flex-1 flex-col gap-1 overflow-y-auto">
    <ul className="flex flex-1 flex-col gap-1 overflow-y-auto" role="list">
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
    <nav className={cn('flex flex-1 flex-col gap-1 overflow-y-auto', isCollapsed && 'items-center')}>
      {ADMIN_NAV_ITEMS.map((item) => {
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
    <nav className="flex flex-1 flex-col gap-[var(--space-1)] overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const enabled = isEnabled(item.module);
        const isActive = activeHref === item.href;
        const label = t(item.key, item.fallback);
        const Icon = NAV_ICON_MAP[item.module] ?? LayoutDashboard;

        if (!enabled) {
          const disabledContent = (
            <div
          return (
            <li key={item.href}>
              <button
                type="button"
                aria-disabled
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-500/70',
                  'border border-dashed border-white/5 bg-slate-950/50',
                )}
              >
                <span>{label}</span>
                <Badge variant="outline" className="border-amber-400/30 text-[10px] uppercase tracking-wide text-amber-200">
                  Off
                </Badge>
              </button>
            </li>
            <button
              key={item.href}
              type="button"
              aria-disabled
              disabled
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 text-body-sm text-slate-500/70',
                'flex w-full items-center gap-3 rounded-xl border border-dashed border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-slate-500/70',
                isCollapsed && 'w-12 justify-center px-2 py-3',
                'flex items-center justify-between rounded-xl px-[var(--space-3)] py-[var(--space-2)] text-sm text-slate-500/70',
                'border border-dashed border-white/5 bg-slate-950/50',
              )}
            >
              <span>{label}</span>
              <Badge variant="outline" className="border-amber-400/30 text-[10px] uppercase tracking-wide text-amber-200">
                {t('admin.shell.nav.disabled', 'Off')}
              </Badge>
            </button>
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
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-400">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              aria-current={isActive ? 'page' : undefined}
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
          </li>
          <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span className="text-slate-600">/</span> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="transition-colors hover:text-primary">
                {crumb.label}
              </Link>
            ) : (
              <span className={cn('truncate', isLast ? 'text-white' : undefined)}>{crumb.label}</span>
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'group flex items-center justify-between rounded-xl px-3 py-2 text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'group flex items-center justify-between rounded-xl px-[var(--space-3)] py-[var(--space-2)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'text-slate-300 hover:bg-primary/10 hover:text-primary',
              isCollapsed && 'w-12 justify-center px-2 py-3 text-base',
            )}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect?.()}
          >
            <Icon className={cn('h-4 w-4', isCollapsed && 'h-5 w-5')} aria-hidden />
            {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
          </Link>
          </div>
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
    </ul>
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
  const segments = useSelectedLayoutSegments();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { locale, setLocale, loading: localeLoading, t } = useAdminLocale();
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const { locale, setLocale, loading: localeLoading } = useAdminLocale();
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

    const deniedMessages: Record<string, { key: string; fallback: string }> = {
      orders: {
        key: 'admin.toast.denied.orders',
        fallback: 'You lack permission to view order management. Contact an admin to request access.',
      },
      'match-ops': {
        key: 'admin.toast.denied.matchOps',
        fallback: 'Match operations require the match:update permission.',
      },
      translations: {
        key: 'admin.toast.denied.translations',
        fallback: 'Translations console requires the translation:view permission.',
      },
      membership: {
        key: 'admin.toast.denied.membership',
        fallback: 'Membership console requires the membership:member:view permission.',
      },
      fundraising: {
        key: 'admin.toast.denied.fundraising',
        fallback: 'Fundraising console requires the fundraising:donation:view permission.',
      },
      reports: {
        key: 'admin.toast.denied.reports',
        fallback: 'Reports require the reports:view permission.',
      },
    };

    toast({
      title: t('admin.toast.denied.title', 'Access denied'),
      description: t(
        deniedMessages[denied]?.key ?? 'admin.toast.denied.generic',
        deniedMessages[denied]?.fallback ?? 'You do not have permission to access that section.',
      ),
      variant: 'destructive',
    });

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('denied');
    const next = params.toString();
    const current = pathname || '/admin';
    router.replace(next ? `${current}?${next}` : current);
  }, [pathname, router, searchParams, t, toast]);

  useEffect(() => {
    if (mobileNavOpen) {
      const focusable = mobileSheetRef.current?.querySelector<HTMLElement>(
        'a[href]:not([aria-disabled="true"]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
      return;
    }

    if (!mobileNavOpen && menuTriggerRef.current) {
      menuTriggerRef.current.focus();
    }
  }, [mobileNavOpen]);
  const handleSkipToContent = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const main = document.getElementById('admin-main-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <a
        href="#admin-main-content"
        onClick={handleSkipToContent}
        className="absolute left-4 top-3 z-50 -translate-y-full transform rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-0 focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Skip to main content
      </a>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      <aside
        className="relative hidden flex-col border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur-xl md:flex md:w-[clamp(15rem,20vw,18.5rem)] xl:px-6 xl:py-8"
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <aside className="relative hidden w-72 flex-col border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur-xl md:flex" aria-labelledby="admin-nav-heading">
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
      <nav
        aria-label="Admin sections"
        className="relative hidden w-72 flex-col border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur-xl md:flex"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-heading-sm font-semibold tracking-tight text-primary">
  const hasSecondary = Boolean(secondaryPanel);

  return (
    <div
      className={cn(
        'relative grid min-h-screen grid-cols-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100',
        'md:grid-cols-admin-shell',
        hasSecondary ? 'lg:grid-cols-admin-shell-rail' : 'lg:grid-cols-admin-shell',
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
        <NavItemsList activeHref={activeHref} />
        <div className="mt-shell-stack flex-1 overflow-hidden">
          <NavItems activeHref={activeHref} />
        </div>
        <h2 id="admin-nav-heading" className="sr-only">
          Admin navigation
        </h2>
        <NavItems activeHref={activeHref} />
        <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-3 text-body-sm text-slate-300">
          <div className="text-body font-semibold text-slate-100">Signed in</div>
        <NavItems states={navStates} activeItem={activeItem} />
        <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
        <div className="mt-shell-stack rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
          <div className="font-semibold text-slate-100">Signed in</div>
          <div>{user.displayName}</div>
          <div className="truncate text-caption text-slate-400/80">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role} variant="secondary" className="bg-primary/15 text-primary">
                {role}
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
      </nav>
      <div className="relative z-[1] flex min-h-screen flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 xl:px-10 2xl:px-12"
        >
          <div className="flex items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
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
                  ref={menuTriggerRef}
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white md:hidden"
                  aria-label={t('admin.shell.menu.aria', 'Toggle navigation')}
                >
                  <Menu className="h-4 w-4" />
                  {t('admin.shell.menu.label', 'Menu')}
                  aria-label="Open navigation menu"
                  aria-controls="admin-mobile-navigation"
                  aria-expanded={mobileNavOpen}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  Sign out
                </Button>
              </SheetTrigger>
            <SheetContent side="left" className="w-[260px] border-white/10 bg-slate-950/95 text-slate-100">
              <SheetHeader className="text-left">
                <SheetTitle className="text-heading-sm font-semibold text-white">Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
              <SheetContent
                side="left"
                className="w-[260px] border-white/10 bg-slate-950/95 text-slate-100"
                ref={mobileSheetRef}
                aria-label="Admin navigation"
                id="admin-mobile-navigation"
              >
                <SheetHeader className="text-left">
                  <SheetTitle className="text-lg font-semibold text-white">
                    {t('admin.shell.menu.sheetTitle', 'Navigation')}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <NavItems activeHref={activeHref} onSelect={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <form role="search" className="hidden md:block">
              <label htmlFor="admin-search" className="sr-only">
                Search admin data
              </label>
              <input
                id="admin-search"
                type="search"
                placeholder="Search operations"
                aria-describedby="admin-search-hint"
                className="w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0"
              />
              <span id="admin-search-hint" className="sr-only">
                Type to filter tables and navigation results.
              </span>
            </form>
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
                <nav aria-label="Admin sections" className="mt-6">
                  <NavItemsList activeHref={activeHref} />
                </nav>
              </SheetContent>
            </Sheet>
            <input
              type="search"
              placeholder={t('admin.shell.search.placeholder', 'Search ops…')}
              placeholder="Search ops…"
              className="hidden w-[clamp(16rem,22vw,20rem)] min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0 md:block"
              className="hidden w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0 md:block"
              aria-label="Search admin operations"
            />
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
          <input
            type="search"
            placeholder="Search ops…"
            className="hidden w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-sm outline-none placeholder:text-slate-400 focus:border-primary/60 focus:ring-0 md:block"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 text-caption text-slate-400/80 md:flex">
            <span className="type-caption text-slate-400/80">Lang</span>
            <div className="flex overflow-hidden rounded-full border border-white/10">
              {(['en', 'rw'] as const).map((code) => {
                const isActive = locale === code;
                return (
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
              <span className="uppercase tracking-wide">{t('admin.shell.language.toggleLabel', 'Lang')}</span>
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
          <Button variant="ghost" size="sm" className="hidden items-center gap-2 text-body text-slate-300 hover:text-white md:flex">
            Quick actions
            <ChevronDown className="h-4 w-4" />
          </Button>
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
            <Button variant="ghost" size="sm" className="hidden items-center gap-2 text-slate-300 hover:text-white md:flex">
              {t('admin.shell.quickActions', 'Quick actions')}
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
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary"
              aria-live="polite"
              aria-label={isLoggingOut ? 'Signing out of admin' : 'Sign out of admin'}
            >
              {t('admin.shell.signOut', 'Sign out')}
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
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
        </header>
        <main className="relative flex-1 overflow-y-auto">
          <div className="absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
          <div
            className="relative z-[1] mx-auto flex w-full max-w-[min(90rem,calc(100vw-3rem))] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 2xl:max-w-[min(100rem,calc(100vw-6rem))] 2xl:px-12"
          >
            {children}
          </div>
        <main id="admin-main" className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8" tabIndex={-1}>
        <main id="admin-main-content" tabIndex={-1} className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8">
        </div>
        <main className="relative flex-1 overflow-y-auto px-shell-gutter py-shell-stack">
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
