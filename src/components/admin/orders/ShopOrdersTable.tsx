'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AttachSmsModal } from '@/components/admin/orders/AttachSmsModal';
import { useAdminSession } from '@/providers/admin-session-provider';
import { AdminInlineMessage } from '@/components/admin/ui';
import { AdminShopOrder, PaginatedResponse, fetchAdminShopOrders } from '@/lib/api/admin/orders';
import { useAdminFilters, useAdminSearch } from '@/lib/admin-ui';

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
  const [page, setPage] = useState(initial.meta.page);
  const [pageSize] = useState(initial.meta.pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<{ id: string; amount: number } | null>(null);

  const { search, debouncedSearch, setSearch, isDebouncing } = useAdminSearch({
    storageKey: 'admin::shop-orders::search',
  });

  const { filters, setFilter } = useAdminFilters({
    defaults: { status: 'all' },
    paramMap: { status: 'status' },
    storageKey: 'admin::shop-orders::filters',
  });

  const status = filters.status ?? 'all';

  const loadOrders = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetchAdminShopOrders({
          page: targetPage,
          pageSize,
          search: debouncedSearch ? debouncedSearch : undefined,
          status: status === 'all' ? undefined : status,
        });
        setData(response.data);
        setMeta(response.meta);
        setPage(response.meta.page);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load shop orders';
        setLoadError(message);
        toast({ title: 'Failed to load shop orders', description: message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, pageSize, status, toast],
  );

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
    void loadOrders(page);
  }, [loadOrders, page]);

  const columns = useMemo<ColumnDef<AdminShopOrder, unknown>[]>(
    () => [
      {
        header: 'Order',
        accessorKey: 'id',
        cell: ({ row }) => <span className="font-mono text-xs text-primary/80">{row.original.id.slice(0, 8)}…</span>,
      },
      {
        header: 'Customer',
        cell: ({ row }) => {
          const orderUser = row.original.user;
          if (!orderUser) return <span className="text-muted-foreground">Guest</span>;
          return <span className="text-sm text-slate-100">{orderUser.email ?? '—'}</span>;
        },
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
            {row.original.status !== 'fulfilled' && row.original.status !== 'cancelled' ? (
              <Button variant="outline" size="sm" onClick={() => handleAttachOpen(row.original)}>
                Attach SMS
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [handleAttachOpen],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-400">Status</span>
        <div className="flex flex-wrap gap-2">
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
      <DataTable
        columns={columns}
        data={data}
        meta={meta}
        isLoading={isLoading || isDebouncing}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        searchValue={search}
        searchPlaceholder="Search order ID or email"
      />
      {loadError ? (
        <AdminInlineMessage tone="critical" title="Unable to refresh orders" description={loadError} />
      ) : null}
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
