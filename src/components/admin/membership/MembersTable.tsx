'use client';

import { useCallback, useEffect, useMemo, useState, useTransition, useId } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import type { PaginatedResponse, AdminMembershipRecord } from '@/lib/api/admin/membership';
import { fetchAdminMembershipMembers, updateAdminMembershipStatus } from '@/lib/api/admin/membership';

const statusFilters = ['all', 'pending', 'active', 'cancelled', 'expired'] as const;
const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  active: 'Active',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export type MembersTableProps = {
  initial: PaginatedResponse<AdminMembershipRecord>;
};

export const MembersTable = ({ initial }: MembersTableProps) => {
  const { toast } = useToast();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const statusFilterId = useId();

  const loadMembers = useCallback(
    async ({ page, search, nextStatus }: { page?: number; search?: string; nextStatus?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetchAdminMembershipMembers({
          page: page ?? meta.page,
          pageSize: meta.pageSize,
          search: search ?? searchTerm,
          status: (nextStatus ?? status) === 'all' ? undefined : (nextStatus ?? status),
        });
        setData(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error(error);
        toast({ title: 'Failed to load members', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.pageSize, searchTerm, status, toast],
  );

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      startTransition(() => {
        void loadMembers({ page: 1, search: term });
      });
    },
    [loadMembers],
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      setStatus(value);
      startTransition(() => {
        void loadMembers({ page: 1, nextStatus: value });
      });
    },
    [loadMembers],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        void loadMembers({ page });
      });
    },
    [loadMembers],
  );

  useEffect(() => {
    setData(initial.data);
    setMeta(initial.meta);
  }, [initial]);

  const updateStatus = useCallback(
    async (membershipId: string, nextStatus: string, autoRenew?: boolean) => {
      try {
        const updated = await updateAdminMembershipStatus(membershipId, {
          status: nextStatus,
          ...(typeof autoRenew === 'boolean' ? { autoRenew } : {}),
        });
        setData((prev) =>
          prev.map((m) =>
            m.id === membershipId ? { ...m, status: updated.status, autoRenew: updated.autoRenew } : m,
          ),
        );
        toast({ title: 'Member updated' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        toast({ title: 'Failed to update member', description: msg, variant: 'destructive' });
      }
    },
    [toast],
  );

  const columns = useMemo<ColumnDef<AdminMembershipRecord, unknown>[]>(
    () => [
      {
        header: 'User',
        cell: ({ row }) => (
          <span className="text-slate-300">{row.original.user?.email ?? row.original.user?.phoneMask ?? row.original.userId}</span>
        ),
      },
      {
        header: 'Plan',
        cell: ({ row }) => <span className="text-slate-100">{row.original.plan?.name ?? '—'}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <Select defaultValue={row.original.status} onValueChange={(v) => void updateStatus(row.original.id, v)}>
            <SelectTrigger
              className="h-8 w-40 bg-white/5 text-slate-100"
              aria-label={`Update status for member ${row.original.id}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['pending', 'active', 'cancelled', 'expired'] as const).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {statusLabels[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        header: 'Auto‑renew',
        accessorKey: 'autoRenew',
        cell: ({ row }) => (
          <Switch
            checked={row.original.autoRenew}
            onCheckedChange={(v) => void updateStatus(row.original.id, row.original.status, v)}
            aria-label={`Toggle auto-renew for member ${row.original.id}`}
          />
        ),
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        header: 'Expires',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {row.original.expiresAt ? formatDistanceToNow(new Date(row.original.expiresAt), { addSuffix: true }) : '—'}
          </span>
        ),
      },
    ],
    [updateStatus],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label htmlFor={statusFilterId} className="text-xs uppercase tracking-wide text-slate-400">
          Status
        </Label>
        <Select value={status} onValueChange={handleStatusFilter}>
          <SelectTrigger id={statusFilterId} className="h-8 w-48 bg-white/5 text-slate-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        meta={meta}
        isLoading={isLoading || isPending}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search email/phone"
        searchLabel="Search members"
        caption="Membership records with plan enrollment, status, and renewal controls"
      />
    </div>
  );
};
