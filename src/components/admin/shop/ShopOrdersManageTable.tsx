'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import type { PaginatedResponse, AdminShopOrder } from '@/lib/api/admin/shop';
import {
  fetchAdminShopOrders,
  updateAdminShopStatus,
  addAdminShopFulfillmentNote,
  updateAdminShopTracking,
} from '@/lib/api/admin/shop';

const statusFilters = ['all', 'pending', 'ready', 'fulfilled', 'cancelled'] as const;
export type ShopOrdersManageTableProps = {
  initial: PaginatedResponse<AdminShopOrder>;
};

export const ShopOrdersManageTable = ({ initial }: ShopOrdersManageTableProps) => {
  const { toast } = useToast();
  const { t } = useAdminLocale();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  const loadOrders = useCallback(
    async ({ page, search, nextStatus }: { page?: number; search?: string; nextStatus?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetchAdminShopOrders({
          page: page ?? meta.page,
          pageSize: meta.pageSize,
          search: search ?? searchTerm,
          status: (nextStatus ?? status) === 'all' ? undefined : (nextStatus ?? status),
        });
        setData(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error(error);
        toast({ title: t('admin.toast.shop.orders.loadFailed', 'Failed to load shop orders'), variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.pageSize, searchTerm, status, t, toast],
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

  const handleStatusFilter = useCallback(
    (value: string) => {
      setStatus(value);
      startTransition(() => {
        void loadOrders({ page: 1, nextStatus: value });
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

  const applyStatus = useCallback(
    async (orderId: string, nextStatus: string) => {
      try {
        const note = noteDrafts[orderId]?.trim();
        const updated = await updateAdminShopStatus(orderId, { status: nextStatus, note: note || undefined });
        setData((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: updated.status, fulfillmentNotes: updated.fulfillmentNotes } : o,
          ),
        );
        toast({ title: t('admin.toast.shop.orders.updated', 'Order updated') });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        toast({
          title: t('admin.toast.shop.orders.updateFailed', 'Failed to update order'),
          description: msg,
          variant: 'destructive',
        });
      }
    },
    [noteDrafts, t, toast],
  );

  const saveNote = useCallback(
    async (orderId: string) => {
      try {
        const note = noteDrafts[orderId]?.trim();
        if (!note) return;
        const updated = await addAdminShopFulfillmentNote(orderId, note);
        setData((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        setNoteDrafts((m) => ({ ...m, [orderId]: '' }));
        toast({ title: t('admin.toast.shop.orders.noteAdded', 'Note added') });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add note';
        toast({
          title: t('admin.toast.shop.orders.noteFailed', 'Failed to add note'),
          description: msg,
          variant: 'destructive',
        });
      }
    },
    [noteDrafts, t, toast],
  );

  const saveTracking = useCallback(
    async (orderId: string) => {
      try {
        const updated = await updateAdminShopTracking(orderId, trackingDrafts[orderId] ?? undefined);
        setData((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        toast({ title: t('admin.toast.shop.orders.trackingUpdated', 'Tracking updated') });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update tracking';
        toast({
          title: t('admin.toast.shop.orders.trackingFailed', 'Failed to update tracking'),
          description: msg,
          variant: 'destructive',
        });
      }
    },
    [t, toast, trackingDrafts],
  );

  const columns = useMemo<ColumnDef<AdminShopOrder, unknown>[]>(
    () => [
      {
        header: t('admin.shop.orders.table.order', 'Order'),
        accessorKey: 'id',
        cell: ({ row }) => <span className="font-mono text-xs text-primary/80">{row.original.id.slice(0, 8)}…</span>,
      },
      {
        header: t('admin.shop.orders.table.when', 'When'),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        header: t('admin.shop.orders.table.customer', 'Customer'),
        cell: ({ row }) => <span className="text-slate-300">{row.original.user?.email ?? row.original.user?.phoneMask ?? 'Guest'}</span>,
      },
      {
        header: t('admin.shop.orders.table.items', 'Items'),
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
        header: t('admin.shop.orders.table.total', 'Total'),
        accessorKey: 'total',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.total.toLocaleString()} RWF</span>,
      },
      {
        header: t('admin.shop.orders.table.status', 'Status'),
        accessorKey: 'status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Select defaultValue={row.original.status} onValueChange={(v) => void applyStatus(row.original.id, v)}>
              <SelectTrigger className="h-8 w-40 bg-white/5 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['pending', 'ready', 'fulfilled', 'cancelled'] as const).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {t(`admin.shop.orders.status.${s}`, statusLabelFallback(s))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t('admin.form.shop.orders.note.placeholder', 'Note')}
              value={noteDrafts[row.original.id] ?? ''}
              onChange={(e) => setNoteDrafts((m) => ({ ...m, [row.original.id]: e.target.value }))}
              className="h-8 w-40 bg-white/5"
            />
            <Button size="sm" variant="outline" onClick={() => void saveNote(row.original.id)}>
              {t('admin.shop.orders.actions.addNote', 'Add Note')}
            </Button>
          </div>
        ),
      },
      {
        header: t('admin.shop.orders.table.tracking', 'Tracking'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Input
              placeholder={t('admin.form.shop.orders.tracking.placeholder', 'Tracking #')}
              value={trackingDrafts[row.original.id] ?? row.original.trackingNumber ?? ''}
              onChange={(e) => setTrackingDrafts((m) => ({ ...m, [row.original.id]: e.target.value }))}
              className="h-8 w-40 bg-white/5"
            />
            <Button size="sm" variant="outline" onClick={() => void saveTracking(row.original.id)}>
              {t('admin.shop.orders.actions.saveTracking', 'Save')}
            </Button>
          </div>
        ),
      },
    ],
    [applyStatus, noteDrafts, saveNote, saveTracking, t, trackingDrafts],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {t('admin.shop.orders.filters.status.label', 'Status')}
        </span>
        <Select value={status} onValueChange={handleStatusFilter}>
          <SelectTrigger className="h-8 w-48 bg-white/5 text-slate-100">
            <SelectValue placeholder={t('admin.shop.orders.filters.status.placeholder', 'Status')} />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {t(`admin.shop.orders.status.${s}`, statusLabelFallback(s))}
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
        searchPlaceholder={t('admin.shop.orders.search.placeholder', 'Search order id/email')}
      />
    </div>
  );
};

const statusLabelFallback = (status: string) => {
  switch (status) {
    case 'all':
      return 'All';
    case 'pending':
      return 'Pending';
    case 'ready':
      return 'Ready';
    case 'fulfilled':
      return 'Fulfilled';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};
