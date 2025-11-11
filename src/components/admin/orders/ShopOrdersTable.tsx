'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AttachSmsModal } from '@/components/admin/orders/AttachSmsModal';
import { useAdminSession } from '@/providers/admin-session-provider';
import { AdminShopOrder, PaginatedResponse, fetchAdminShopOrders } from '@/lib/api/admin/orders';
import { ResponsiveSection, responsiveSection } from '@/components/admin/layout/ResponsiveSection';

const statusFilters = ['all', 'pending', 'fulfilled', 'cancelled'] as const;

const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export type ShopOrdersTableProps = {
  initial: PaginatedResponse<AdminShopOrder>;
};

export const ShopOrdersTable = ({ initial }: ShopOrdersTableProps) => {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [attachTarget, setAttachTarget] = useState<{ id: string; amount: number } | null>(null);

  const loadOrders = useCallback(
    async ({ page, search, status: nextStatus }: { page?: number; search?: string; status?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetchAdminShopOrders({
          page: page ?? meta.page,
          pageSize: meta.pageSize,
          search: search ?? searchTerm,
          status: nextStatus === 'all' ? undefined : nextStatus,
        });
        setData(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error(error);
        toast({ title: 'Failed to load shop orders', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.pageSize, searchTerm, toast],
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

  useEffect(() => {
    setData(initial.data);
    setMeta(initial.meta);
  }, [initial]);

  const handleAttachOpen = useCallback((order: AdminShopOrder) => {
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

  const columns = useMemo<ColumnDef<AdminShopOrder, unknown>[]>(
    () => [
      {
        header: 'Order',
        accessorKey: 'id',
        enableHiding: false,
        cell: ({ row }) => <span className="font-mono text-xs text-primary/80">{row.original.id.slice(0, 8)}…</span>,
      },
      {
        header: 'Customer',
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-muted-foreground">Guest</span>;
          return <span className="text-sm text-slate-100">{user.email ?? '—'}</span>;
        },
        meta: { responsive: { hideBelow: 'md' }, columnLabel: 'Customer' },
      },
      {
        header: 'Items',
        cell: ({ row }) => (
          <div className="text-xs text-slate-300">
            {row.original.items.map((item) => (
              <div key={item.id}>
                {item.qty} × {item.product.name}
              </div>
            ))}
          </div>
        ),
        meta: { responsive: { hideBelow: 'lg' }, columnLabel: 'Items' },
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
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.status !== 'fulfilled' && row.original.status !== 'cancelled' ? (
              <Button variant="outline" size="sm" onClick={() => handleAttachOpen(row.original)}>
                Attach SMS
              </Button>
            ) : null}
          </div>
        ),
        enableHiding: false,
      },
    ],
    [handleAttachOpen],
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
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search order ID or email"
        searchLabel="Search shop orders"
        caption="Shop orders with customer information, totals, and fulfillment status"
      />
      {attachTarget ? (
        <AttachSmsModal
          open={Boolean(attachTarget)}
          onOpenChange={handleModalClose}
          entity={{ kind: 'order', id: attachTarget.id }}
          amount={attachTarget.amount}
          adminUserId={user?.id}
          onAttached={handleAttached}
        />
      ) : null}
    </div>
  );
};
