'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { AdminBottomSheet, AdminInlineMessage } from '@/components/admin/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_FILTERS = {
  search: '',
  adminUserId: null as string | null,
  action: null as string | null,
};

type AuditActor = {
  id: string;
  display_name?: string | null;
  email?: string | null;
};

type AuditLogEntry = {
  id: string;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  context?: unknown;
  at: string | null;
  ip: string | null;
  ua: string | null;
  admin_user_id: string | null;
  admin?: AuditActor | null;
};

type Filters = typeof DEFAULT_FILTERS;

const formatTimestamp = (value: string | null) => {
  if (!value) return 'Unknown';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    console.error('Failed to format audit timestamp', error);
    return value;
  }
};

const stringify = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    console.error('Failed to stringify audit payload', error);
    return String(value);
  }
};

export const AdminAuditLogTable = ({ initial }: { initial?: AuditLogEntry[] }) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>(initial ?? []);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [searchDraft, setSearchDraft] = useState('');
  const [isLoading, setIsLoading] = useState(!(initial && initial.length));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const load = useCallback(
    async (nextFilters: Filters, { silentRefresh = false }: { silentRefresh?: boolean } = {}) => {
      if (silentRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams({ limit: '100' });
        if (nextFilters.search) params.set('search', nextFilters.search);
        if (nextFilters.adminUserId) params.set('adminUserId', nextFilters.adminUserId);
        if (nextFilters.action) params.set('action', nextFilters.action);

        const response = await fetch(`/admin/api/admin/audit?${params.toString()}`, {
          credentials: 'include',
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'audit_fetch_failed');
        }

        const rows = (payload?.data?.logs ?? payload?.logs ?? []) as AuditLogEntry[];
        setLogs(rows);
      } catch (error) {
        toast({
          title: 'Failed to load audit logs',
          description: error instanceof Error ? error.message : undefined,
          variant: 'destructive',
        });
      } finally {
        if (silentRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    if (initial && initial.length) {
      setIsLoading(false);
      return;
    }
    void load({ ...DEFAULT_FILTERS });
  }, [initial, load]);

  const applyFilters = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        void load(next);
        return next;
      });
    },
    [load],
  );

  const adminOptions = useMemo(() => {
    const entries = new Map<string, { id: string; label: string }>();
    for (const log of logs) {
      const actorId = log.admin_user_id ?? log.admin?.id;
      if (!actorId) continue;
      if (entries.has(actorId)) continue;
      const label =
        log.admin?.display_name?.trim() || log.admin?.email?.trim() || `Admin ${actorId.slice(0, 6)}`;
      entries.set(actorId, { id: actorId, label });
    }
    return Array.from(entries.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [logs]);

  const actionOptions = useMemo(() => {
    const values = new Set<string>();
    for (const log of logs) {
      if (log.action) values.add(log.action);
    }
    return Array.from(values.values()).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const handleSearchSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      applyFilters({ search: searchDraft.trim() });
    },
    [applyFilters, searchDraft],
  );

  const refresh = useCallback(() => {
    void load(filters, { silentRefresh: true });
  }, [filters, load]);

  useEffect(() => {
    setSearchDraft(filters.search ?? '');
  }, [filters.search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Audit history</h2>
          <p className="text-sm text-slate-400">Immutable log of admin mutations with before/after snapshots.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing || isLoading}>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <AdminInlineMessage
        tone="neutral"
        title="Monitoring"
        description="Use filters to narrow actions by admin or action key. Details include before/after payloads and metadata."
      />

      <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px_auto]" onSubmit={handleSearchSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-search" className="text-xs uppercase tracking-wide text-slate-400">
            Search
          </Label>
          <Input
            id="audit-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Action or entity id"
            className="h-11 bg-slate-900/70 text-slate-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-admin-filter" className="text-xs uppercase tracking-wide text-slate-400">
            Admin
          </Label>
          <Select
            value={filters.adminUserId ?? 'all'}
            onValueChange={(value) => applyFilters({ adminUserId: value === 'all' ? null : value })}
          >
            <SelectTrigger id="audit-admin-filter" className="h-11 bg-slate-900/70 text-left text-slate-100">
              <SelectValue placeholder="All admins" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-100">
              <SelectItem value="all">All admins</SelectItem>
              {adminOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-action-filter" className="text-xs uppercase tracking-wide text-slate-400">
            Action
          </Label>
          <Select
            value={filters.action ?? 'all'}
            onValueChange={(value) => applyFilters({ action: value === 'all' ? null : value })}
          >
            <SelectTrigger id="audit-action-filter" className="h-11 bg-slate-900/70 text-left text-slate-100">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-100">
              <SelectItem value="all">All actions</SelectItem>
              {actionOptions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isLoading}>
            Apply filters
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`audit-skeleton-${index}`} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-sm text-slate-400">
          No audit events recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const actorLabel =
              log.admin?.display_name?.trim() ||
              log.admin?.email?.trim() ||
              (log.admin_user_id ? `Admin ${log.admin_user_id.slice(0, 6)}` : 'Unknown admin');
            return (
              <div
                key={log.id}
                className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200 shadow-lg shadow-primary/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-slate-100">
                      <span className="font-semibold">{log.action ?? 'Unknown action'}</span>
                      {log.entity_type ? <Badge variant="outline">{log.entity_type}</Badge> : null}
                    </div>
                    <p className="text-xs text-slate-400">
                      {log.entity_id ? `Entity: ${log.entity_id}` : 'No entity id'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/15 text-primary">
                      {actorLabel}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(log)}>
                      View details
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{formatTimestamp(log.at)}</span>
                  <span>{log.ip ? `IP ${log.ip}` : 'IP unknown'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminBottomSheet
        title={selected?.action ? `Audit event: ${selected.action}` : 'Audit event'}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        {selected ? (
          <div className="space-y-5 text-sm text-slate-200">
            <div className="space-y-1 text-xs text-slate-400">
              <p><span className="font-semibold text-slate-100">Actor:</span> {selected.admin?.display_name ?? selected.admin?.email ?? selected.admin_user_id ?? 'Unknown'}</p>
              <p><span className="font-semibold text-slate-100">Entity:</span> {selected.entity_type ?? '—'} · {selected.entity_id ?? '—'}</p>
              <p><span className="font-semibold text-slate-100">When:</span> {formatTimestamp(selected.at)}</p>
              {selected.ip ? (
                <p><span className="font-semibold text-slate-100">IP:</span> {selected.ip}</p>
              ) : null}
              {selected.ua ? (
                <p className="break-words"><span className="font-semibold text-slate-100">User agent:</span> {selected.ua}</p>
              ) : null}
            </div>
            {selected.context ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">Context</h3>
                <pre className="max-h-52 overflow-y-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
                  {stringify(selected.context) ?? '—'}
                </pre>
              </div>
            ) : null}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-300">After state</h3>
              <pre className="max-h-52 overflow-y-auto rounded-lg bg-slate-900/80 p-3 font-mono text-xs text-emerald-100">
                {stringify(selected.after) ?? '—'}
              </pre>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-rose-300">Before state</h3>
              <pre className="max-h-52 overflow-y-auto rounded-lg bg-slate-900/80 p-3 font-mono text-xs text-rose-100">
                {stringify(selected.before) ?? '—'}
              </pre>
            </div>
          </div>
        ) : null}
      </AdminBottomSheet>
    </section>
  );
};
