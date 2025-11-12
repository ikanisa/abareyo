'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { CrudConfirmDialog, useCrudUndoToast } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AttachSmsModal } from '@/components/admin/orders/AttachSmsModal';
import { useAdminSession } from '@/providers/admin-session-provider';
import { AdminInlineMessage } from '@/components/admin/ui';
import {
  AdminTicketOrder,
  PaginatedResponse,
  fetchAdminTicketOrders,
  refundTicketOrder,
} from '@/lib/api/admin/orders';
import { useAdminFilters, useAdminMutation, useAdminSearch } from '@/lib/admin-ui';
import { ResponsiveSection, responsiveSection } from '@/components/admin/layout/ResponsiveSection';

const statusFilters = ['all', 'pending', 'paid', 'cancelled', 'expired'] as const;

const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
  expired: 'Expired',
  refund_pending: 'Refund pending',
};

export type TicketOrdersTableProps = {
  initial: PaginatedResponse<AdminTicketOrder>;
};

export const TicketOrdersTable = ({ initial }: TicketOrdersTableProps) => {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [page, setPage] = useState(initial.meta.page);
  const [pageSize] = useState(initial.meta.pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<{ id: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<AdminTicketOrder | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const showUndoToast = useCrudUndoToast();
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});

  const { search, debouncedSearch, setSearch, isDebouncing } = useAdminSearch({
    storageKey: 'admin::ticket-orders::search',
  });

  const { filters, setFilter } = useAdminFilters({
    defaults: { status: 'all' },
    paramMap: { status: 'status' },
    storageKey: 'admin::ticket-orders::filters',
  });

  const status = filters.status ?? 'all';

  const loadOrders = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      setError(null);
      setLoadError(null);
      try {
        const response = await fetchAdminTicketOrders({
          page: targetPage,
          pageSize,
          search: debouncedSearch ? debouncedSearch : undefined,
          status: status === 'all' ? undefined : status,
        });
        setData(response.data);
        setMeta(response.meta);
        setPage(response.meta.page);
      } catch (error) {
        console.error(error);
        toast({ title: 'Failed to load ticket orders', variant: 'destructive' });
        setError(error instanceof Error ? error.message : 'unknown_error');
        const message = error instanceof Error ? error.message : 'Unable to load ticket orders';
        setLoadError(message);
        toast({ title: 'Failed to load ticket orders', description: message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, pageSize, status, toast],
  );

  const refundMutation = useAdminMutation<{ orderId: string }, void>({
    mutationFn: async ({ orderId }) => {
      await refundTicketOrder(orderId);
    },
    getEntityId: ({ orderId }) => orderId,
    onMutate: ({ orderId }) => {
      setOptimisticStatuses((prev) => ({ ...prev, [orderId]: 'refund_pending' }));
      return () => {
        setOptimisticStatuses((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      };
    },
    onSuccess: (_, { orderId }) => {
      setOptimisticStatuses((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      void loadOrders(page);
    },
    successToast: {
      title: 'Order marked for refund',
      description: 'Payment flagged for manual reconciliation.',
    },
    errorToast: {
      title: 'Refund failed',
    },
  });

  const { state: refundState, execute: executeRefund } = refundMutation;

  const handleStatusChange = useCallback(
    (next: string) => {
      setFilter('status', next);
      setPage(1);
    },
    [setFilter],
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handleRefund = useCallback(
    (orderId: string) => {
      void executeRefund({ orderId });
    },
    [executeRefund],
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
    void loadOrders(page);
  }, [loadOrders, page]);

  const handleAttachOpen = useCallback((order: AdminTicketOrder) => {
    setAttachTarget({ id: order.id, amount: order.total });
  }, []);

  const handleModalClose = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setAttachTarget(null);
    }
  }, []);

  const handleAttached = useCallback(() => {
    setAttachTarget(null);
    void loadOrders(page);
  }, [loadOrders, page]);

  const columns = useMemo<ColumnDef<AdminTicketOrder, unknown>[]>(
    () => [
      {
        header: 'Order ID',
        accessorKey: 'id',
        enableHiding: false,
        cell: ({ row }) => <span className="font-mono text-xs text-primary/80">{row.original.id.slice(0, 8)}…</span>,
      },
      {
        header: 'Match',
        cell: ({ row }) => {
          const match = row.original.match;
          if (!match) return <span className="text-muted-foreground">–</span>;
          return (
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-100">vs {match.opponent}</div>
              <div className="text-xs text-slate-400">
                {new Date(match.kickoff).toLocaleString()} · {match.venue}
              </div>
            </div>
          );
        },
        meta: { responsive: { hideBelow: 'lg' }, columnLabel: 'Match' },
      },
      {
        header: 'Fan',
        cell: ({ row }) => {
          const ticketUser = row.original.user;
          if (!ticketUser) return <span className="text-muted-foreground">Guest</span>;
          return (
            <div className="space-y-0.5 text-sm">
              <div>{ticketUser.email ?? '—'}</div>
              <div className="text-xs text-slate-400">{ticketUser.phoneMask ?? 'no phone'}</div>
            </div>
          );
        },
        meta: { responsive: { hideBelow: 'md' }, columnLabel: 'Fan' },
      },
      {
        header: 'Total',
        accessorKey: 'total',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.total.toLocaleString()} RWF</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const optimisticStatus = optimisticStatuses[row.original.id];
          const statusKey = optimisticStatus ?? row.original.status;
          return (
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">
              {statusLabels[statusKey] ?? statusKey}
            </span>
          );
        },
        cell: ({ row }) => (
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">
            {statusLabels[row.original.status] ?? row.original.status}
          </span>
        ),
        meta: { responsive: { hideBelow: 'md' }, columnLabel: 'Status' },
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
        meta: { responsive: { hideBelow: 'lg' }, columnLabel: 'Created' },
      },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const optimisticStatus = optimisticStatuses[row.original.id];
          const statusKey = optimisticStatus ?? row.original.status;
          const isRefunding =
            refundState.status === 'loading' && refundState.activeId === row.original.id;
          const canAttach = statusKey !== 'paid';
          return (
            <div className="flex flex-wrap gap-2">
              {canAttach ? (
                <Button variant="outline" size="sm" onClick={() => handleAttachOpen(row.original)}>
                  Attach SMS
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                disabled={statusKey !== 'paid' || isRefunding}
                onClick={() => handleRefund(row.original.id)}
              >
                {isRefunding ? 'Refunding…' : 'Refund'}
              </Button>
            </div>
          );
        },
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={row.original.status !== 'paid' || isPending || isRefunding}
              onClick={() => setConfirmRefund(row.original)}
            >
              Refund
            </Button>
          </div>
        ),
        enableHiding: false,
      },
    ],
    [handleAttachOpen, isPending, isRefunding],
    [handleAttachOpen, handleRefund, optimisticStatuses, refundState.activeId, refundState.status],
  );

  return (
    <div className="space-y-4">
      <ResponsiveSection columns="sidebar" className="md:items-end">
        <div className={responsiveSection.stack}>
          <span className="text-xs uppercase tracking-wide text-slate-400">Status</span>
          <div className={responsiveSection.controlGroup}>
            {statusFilters.map((option) => (
              <Button
                key={option}
                variant={status === option ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleStatusChange(option)}
              >
                {statusLabels[option]}
              </Button>
            ))}
          </div>
        </div>
      </ResponsiveSection>
      <DataTable
        columns={columns}
        data={data}
        meta={meta}
        isLoading={isLoading || isPending}
        isError={Boolean(error)}
        errorState={
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-destructive">Failed to load orders.</p>
            {error ? <p className="text-xs text-muted-foreground">{error}</p> : null}
          </div>
        }
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        searchValue={searchTerm}
        searchPlaceholder="Search order ID or email"
        filterFacets={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            options: statusFilters.map((option) => ({
              value: option,
              label: statusLabels[option],
              disabled: isLoading || isPending,
            })),
            onChange: handleStatusChange,
          },
        ]}
        emptyState={
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>No ticket orders found for the current filters.</p>
            <p className="text-xs">Adjust the search or status facet to broaden the results.</p>
          </div>
        }
        isLoading={isLoading || isDebouncing || refundState.status === 'loading'}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        searchValue={search}
        searchPlaceholder="Search order ID or email"
        searchLabel="Search ticket orders"
        caption="Ticket orders with fan details, payment status, and available actions"
      />
      {loadError ? (
        <AdminInlineMessage tone="critical" title="Unable to refresh ticket orders" description={loadError} />
      ) : null}
      {refundState.status === 'error' && refundState.error ? (
        <AdminInlineMessage tone="critical" title="Refund request failed" description={refundState.error} />
      ) : null}
      {attachTarget ? (
        <AttachSmsModal
          open={Boolean(attachTarget)}
          onOpenChange={handleModalClose}
          entity={{ kind: 'ticket', id: attachTarget.id }}
          amount={attachTarget.amount}
          adminUserId={user?.id}
          onAttached={handleAttached}
        />
      ) : null}
      <CrudConfirmDialog
        intent="danger"
        title="Refund ticket order"
        description="Marking an order for refund notifies finance to reconcile the payment manually."
        confirmLabel="Mark for refund"
        open={Boolean(confirmRefund)}
        loading={isRefunding}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRefund(null);
          }
        }}
        onConfirm={async () => {
          if (!confirmRefund) return;
          try {
            setIsRefunding(true);
            await refundTicketOrder(confirmRefund.id);
            showUndoToast({
              title: 'Order marked for refund',
              description: 'Payment flagged for manual reconciliation.',
              onUndo: () => loadOrders({}),
            });
            await loadOrders({});
          } catch (error) {
            console.error(error);
            toast({
              title: 'Refund failed',
              description: error instanceof Error ? error.message : undefined,
              variant: 'destructive',
            });
          } finally {
            setIsRefunding(false);
            setConfirmRefund(null);
          }
        }}
      >
        {confirmRefund ? (
          <div className="space-y-1 text-xs text-slate-200">
            <p>
              <span className="font-semibold text-slate-100">Order:</span> {confirmRefund.id.slice(0, 8)}…
            </p>
            <p>
              <span className="font-semibold text-slate-100">Total:</span> {confirmRefund.total.toLocaleString()} RWF
            </p>
          </div>
        ) : null}
      </CrudConfirmDialog>
    </div>
  );
};
