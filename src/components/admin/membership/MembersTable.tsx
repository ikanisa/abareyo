'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminInlineMessage } from '@/components/admin/ui';
import { useToast } from '@/components/ui/use-toast';
import type { PaginatedResponse, AdminMembershipRecord } from '@/lib/api/admin/membership';
import { fetchAdminMembershipMembers, updateAdminMembershipStatus } from '@/lib/api/admin/membership';
import { useAdminFilters, useAdminMutation, useAdminSearch } from '@/lib/admin-ui';

const statusFilters = ['all', 'pending', 'active', 'cancelled', 'expired'] as const;
const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  active: 'Active',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

type MembershipUpdateInput = {
  membershipId: string;
  status: string;
  autoRenew?: boolean;
};

export type MembersTableProps = {
  initial: PaginatedResponse<AdminMembershipRecord>;
};

export const MembersTable = ({ initial }: MembersTableProps) => {
  const { toast } = useToast();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [page, setPage] = useState(initial.meta.page);
  const [pageSize] = useState(initial.meta.pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { search, debouncedSearch, setSearch, isDebouncing } = useAdminSearch({
    storageKey: 'admin::members::search',
  });

  const { filters, setFilter } = useAdminFilters({
    defaults: { status: 'all' },
    paramMap: { status: 'status' },
    storageKey: 'admin::members::filters',
  });

  const status = filters.status ?? 'all';

  const loadMembers = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetchAdminMembershipMembers({
          page: targetPage,
          pageSize,
          search: debouncedSearch ? debouncedSearch : undefined,
          status: status === 'all' ? undefined : status,
        });
        setData(response.data);
        setMeta(response.meta);
        setPage(response.meta.page);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load members';
        setLoadError(message);
        toast({ title: 'Failed to load members', description: message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, pageSize, status, toast],
  );

  const membershipMutation = useAdminMutation<MembershipUpdateInput, AdminMembershipRecord>({
    mutationFn: async ({ membershipId, status: nextStatus, autoRenew }) => {
      const payload: { status: string; autoRenew?: boolean } = { status: nextStatus };
      if (typeof autoRenew === 'boolean') {
        payload.autoRenew = autoRenew;
      }
      return updateAdminMembershipStatus(membershipId, payload);
    },
    getEntityId: ({ membershipId }) => membershipId,
    onMutate: ({ membershipId, status: nextStatus, autoRenew }) => {
      let snapshot: AdminMembershipRecord | null = null;
      setData((prev) =>
        prev.map((member) => {
          if (member.id === membershipId) {
            snapshot = member;
            return {
              ...member,
              status: nextStatus,
              ...(typeof autoRenew === 'boolean' ? { autoRenew } : {}),
            };
          }
          return member;
        }),
      );
      return () => {
        if (!snapshot) return;
        setData((prev) => prev.map((member) => (member.id === membershipId ? snapshot! : member)));
      };
    },
    onSuccess: (result) => {
      setData((prev) => prev.map((member) => (member.id === result.id ? result : member)));
    },
    successToast: { title: 'Member updated' },
    errorToast: { title: 'Failed to update member' },
  });

  const { state: mutationState, execute: executeMembershipMutation } = membershipMutation;

  const handleStatusFilter = useCallback(
    (value: string) => {
      setFilter('status', value);
      setPage(1);
    },
    [setFilter],
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const updateStatus = useCallback(
    (membershipId: string, nextStatus: string, autoRenew?: boolean) => {
      void executeMembershipMutation({ membershipId, status: nextStatus, autoRenew });
    },
    [executeMembershipMutation],
  );

  useEffect(() => {
    setData(initial.data);
    setMeta(initial.meta);
    setPage(initial.meta.page);
  }, [initial]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    void loadMembers(page);
  }, [loadMembers, page]);

  const columns = useMemo<ColumnDef<AdminMembershipRecord, unknown>[]>(
    () => [
      {
        header: 'User',
        cell: ({ row }) => (
          <span className="text-slate-300">
            {row.original.user?.email ?? row.original.user?.phoneMask ?? row.original.userId}
          </span>
        ),
      },
      {
        header: 'Plan',
        cell: ({ row }) => <span className="text-slate-100">{row.original.plan?.name ?? '—'}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const isUpdating =
            mutationState.status === 'loading' && mutationState.activeId === row.original.id;
          return (
            <Select
              defaultValue={row.original.status}
              onValueChange={(value) => updateStatus(row.original.id, value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-40 bg-white/5 text-slate-100">
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
          );
        },
      },
      {
        header: 'Auto‑renew',
        accessorKey: 'autoRenew',
        cell: ({ row }) => {
          const isUpdating =
            mutationState.status === 'loading' && mutationState.activeId === row.original.id;
          return (
            <Switch
              checked={row.original.autoRenew}
              disabled={isUpdating}
              onCheckedChange={(value) => updateStatus(row.original.id, row.original.status, value)}
            />
          );
        },
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
    [mutationState.activeId, mutationState.status, updateStatus],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-400">Status</span>
        <Select value={status} onValueChange={handleStatusFilter}>
          <SelectTrigger className="h-8 w-48 bg-white/5 text-slate-100">
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
        isLoading={isLoading || isDebouncing || mutationState.status === 'loading'}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        searchValue={search}
        searchPlaceholder="Search email/phone"
      />
      {loadError ? (
        <AdminInlineMessage tone="critical" title="Unable to refresh members" description={loadError} />
      ) : null}
      {mutationState.status === 'error' && mutationState.error ? (
        <AdminInlineMessage tone="critical" title="Update failed" description={mutationState.error} />
      ) : null}
    </div>
  );
};
