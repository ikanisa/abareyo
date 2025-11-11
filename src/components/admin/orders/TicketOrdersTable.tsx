'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { CrudConfirmDialog, useCrudUndoToast } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AttachSmsModal } from '@/components/admin/orders/AttachSmsModal';
import { useAdminSession } from '@/providers/admin-session-provider';
import {
  AdminTicketOrder,
  PaginatedResponse,
  fetchAdminTicketOrders,
  refundTicketOrder,
} from '@/lib/api/admin/orders';

const statusFilters = ['all', 'pending', 'paid', 'cancelled', 'expired'] as const;

const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export type TicketOrdersTableProps = {
  initial: PaginatedResponse<AdminTicketOrder>;
};

export const TicketOrdersTable = ({ initial }: TicketOrdersTableProps) => {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [attachTarget, setAttachTarget] = useState<{ id: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<AdminTicketOrder | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const showUndoToast = useCrudUndoToast();

  const loadOrders = useCallback(
    async ({ page, search, status: nextStatus }: { page?: number; search?: string; status?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchAdminTicketOrders({
          page: page ?? meta.page,
          pageSize: meta.pageSize,
          search: search ?? searchTerm,
          status: nextStatus ?? status,
        });
        setData(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error(error);
        toast({ title: 'Failed to load ticket orders', variant: 'destructive' });
        setError(error instanceof Error ? error.message : 'unknown_error');
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
        void loadOrders({ page: 1, search: term });
      });
    },
    [loadOrders],
  );

  const handleStatusChange = useCallback(
    (next: string) => {
      setStatus(next);
      startTransition(() => {
        void loadOrders({ page: 1, status: next });
      });
    },
    [loadOrders],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        void loadOrders({ page });
      });
    },
    [loadOrders],
  );

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
    startTransition(() => {
      void loadOrders({});
    });
  }, [loadOrders]);

  useEffect(() => {
    setData(initial.data);
    setMeta(initial.meta);
  }, [initial]);

  const columns = useMemo<ColumnDef<AdminTicketOrder, unknown>[]>(
    () => [
      {
        header: 'Order ID',
        accessorKey: 'id',
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
      },
      {
        header: 'Fan',
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-muted-foreground">Guest</span>;
          return (
            <div className="space-y-0.5 text-sm">
              <div>{user.email ?? '—'}</div>
              <div className="text-xs text-slate-400">{user.phoneMask ?? 'no phone'}</div>
            </div>
          );
        },
      },
      {
        header: 'Total',
        accessorKey: 'total',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.total.toLocaleString()} RWF</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">
            {statusLabels[row.original.status] ?? row.original.status}
          </span>
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
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.status !== 'paid' ? (
              <Button variant="outline" size="sm" onClick={() => handleAttachOpen(row.original)}>
                Attach SMS
              </Button>
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
      },
    ],
    [handleAttachOpen, isPending, isRefunding],
  );

  return (
    <div className="space-y-4">
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
      />
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
