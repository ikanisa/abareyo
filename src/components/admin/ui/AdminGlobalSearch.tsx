'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAdminFeatureFlags } from '@/providers/admin-feature-flags-provider';
import { useAdminSession } from '@/providers/admin-session-provider';
import {
  ADMIN_NAVIGATION_GROUPS,
  ADMIN_QUICK_ACTIONS,
  ADMIN_SEARCH_ENTRIES,
  type AdminNavigationBadge,
  type AdminNavigationGroupKey,
  type AdminSearchEntry,
} from '@/config/admin-navigation';
import type { AdminModuleKey } from '@/providers/admin-feature-flags-provider';
import { hasAnyPermission } from '@/config/admin-rbac';

const badgeToneClassNames: Record<NonNullable<AdminNavigationBadge['tone']>, string> = {
  default: 'border-white/10 bg-white/10 text-white',
  info: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
  success: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
};

const SearchBadge = ({ badge }: { badge?: AdminNavigationBadge }) => {
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

type SearchResultNavigation = AdminSearchEntry & {
  type: 'navigation';
  searchValue: string;
};

type SearchResultAction = {
  type: 'action';
  id: string;
  label: string;
  href: string;
  description?: string;
  group: AdminNavigationGroupKey;
  searchValue: string;
  badge?: AdminNavigationBadge;
};

type SearchResult = SearchResultNavigation | SearchResultAction;

const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

type AdminGlobalSearchProps = {
  className?: string;
};

export const AdminGlobalSearch = ({ className }: AdminGlobalSearchProps) => {
  const router = useRouter();
  const { isEnabled } = useAdminFeatureFlags();
  const { permissions } = useAdminSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' ? /mac/i.test(navigator.platform) : false);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const filterAccess = useCallback(
    (entry: { modules: AdminModuleKey[]; permissions?: string[] }) => {
      const modulesAvailable = entry.modules.some((module) => isEnabled(module));
      const hasAccess = hasAnyPermission(permissions, entry.permissions ?? []);
      return modulesAvailable && hasAccess;
    },
    [isEnabled, permissions],
  );

  const navigationEntries = useMemo<SearchResultNavigation[]>(() => {
    return ADMIN_SEARCH_ENTRIES.filter(filterAccess).map((entry) => ({
      ...entry,
      type: 'navigation' as const,
      searchValue: [entry.label, ...entry.keywords].join(' ').toLowerCase(),
    }));
  }, [filterAccess]);

  const actionEntries = useMemo<SearchResultAction[]>(() => {
    return ADMIN_QUICK_ACTIONS.filter(filterAccess).map((action) => ({
      type: 'action' as const,
      id: `action:${action.id}`,
      label: action.label,
      href: action.href,
      description: action.description,
      group: action.group,
      badge: action.badge,
      searchValue: [action.label, ...(action.keywords ?? [])].join(' ').toLowerCase(),
    }));
  }, [filterAccess]);

  const debouncedQuery = useDebouncedValue(query, 120);

  const results = useMemo<SearchResult[]>(() => {
    const combined: SearchResult[] = [...navigationEntries, ...actionEntries];
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (!trimmed) {
      return combined;
    }
    return combined.filter((entry) => entry.searchValue.includes(trimmed));
  }, [actionEntries, navigationEntries, debouncedQuery]);

  const navigationGroups = useMemo(() => {
    return results
      .filter((entry): entry is SearchResultNavigation => entry.type === 'navigation')
      .reduce<Map<AdminNavigationGroupKey, SearchResultNavigation[]>>((acc, entry) => {
        const list = acc.get(entry.group) ?? [];
        list.push(entry);
        acc.set(entry.group, list);
        return acc;
      }, new Map());
  }, [results]);

  const actionGroups = useMemo(() => {
    return results
      .filter((entry): entry is SearchResultAction => entry.type === 'action')
      .reduce<Map<AdminNavigationGroupKey, SearchResultAction[]>>((acc, entry) => {
        const list = acc.get(entry.group) ?? [];
        list.push(entry);
        acc.set(entry.group, list);
        return acc;
      }, new Map());
  }, [results]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary/40 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="font-medium">Search admin</span>
          <span className="hidden text-xs text-slate-500 sm:inline">Jump to areas, data, and quick actions</span>
        </span>
        <kbd className="hidden rounded border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-300 sm:flex">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search operations…" />
        <CommandList>
          <CommandEmpty>No matches. Try a different keyword.</CommandEmpty>
          {Array.from(navigationGroups.entries()).map(([groupKey, entries]) => {
            const group = ADMIN_NAVIGATION_GROUPS[groupKey];
            return (
              <CommandGroup key={`nav-${groupKey}`} heading={`${group?.label ?? groupKey} · Navigation`}>
                {entries.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={entry.searchValue}
                    onSelect={() => handleSelect(entry.href)}
                  >
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-slate-100">{entry.label}</span>
                      {entry.description ? (
                        <span className="text-xs text-slate-400">{entry.description}</span>
                      ) : null}
                    </div>
                    <SearchBadge badge={entry.badge} />
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
          {Array.from(actionGroups.entries()).map(([groupKey, entries]) => {
            const group = ADMIN_NAVIGATION_GROUPS[groupKey];
            return (
              <CommandGroup key={`action-${groupKey}`} heading={`${group?.label ?? groupKey} · Quick actions`}>
                {entries.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={entry.searchValue}
                    onSelect={() => handleSelect(entry.href)}
                  >
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-slate-100">{entry.label}</span>
                      {entry.description ? (
                        <span className="text-xs text-slate-400">{entry.description}</span>
                      ) : null}
                    </div>
                    <SearchBadge badge={entry.badge} />
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </div>
  );
};
