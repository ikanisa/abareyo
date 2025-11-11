'use client';

import { useCallback, useEffect, useMemo, useState, useTransition, useId } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import type { PaginatedResponse, AdminShopOrder } from '@/lib/api/admin/shop';
import {
  fetchAdminShopOrders,
  updateAdminShopStatus,
  addAdminShopFulfillmentNote,
  updateAdminShopTracking,
} from '@/lib/api/admin/shop';

const statusFilters = ['all', 'pending', 'ready', 'fulfilled', 'cancelled'] as const;
const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  ready: 'Ready',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export type ShopOrdersManageTableProps = {
  initial: PaginatedResponse<AdminShopOrder>;
};

export const ShopOrdersManageTable = ({ initial }: ShopOrdersManageTableProps) => {
  const { toast } = useToast();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const statusFilterId = useId();

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
        toast({ title: 'Failed to load shop orders', variant: 'destructive' });
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
        toast({ title: 'Order updated' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        toast({ title: 'Failed to update order', description: msg, variant: 'destructive' });
      }
    },
    [noteDrafts, toast],
  );

  const saveNote = useCallback(
    async (orderId: string) => {
      try {
        const note = noteDrafts[orderId]?.trim();
        if (!note) return;
        const updated = await addAdminShopFulfillmentNote(orderId, note);
        setData((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        setNoteDrafts((m) => ({ ...m, [orderId]: '' }));
        toast({ title: 'Note added' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add note';
        toast({ title: 'Failed to add note', description: msg, variant: 'destructive' });
      }
    },
    [noteDrafts, toast],
  );

  const saveTracking = useCallback(
    async (orderId: string) => {
      try {
        const updated = await updateAdminShopTracking(orderId, trackingDrafts[orderId] ?? undefined);
        setData((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        toast({ title: 'Tracking updated' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update tracking';
        toast({ title: 'Failed to update tracking', description: msg, variant: 'destructive' });
      }
    },
    [trackingDrafts, toast],
  );

  const columns = useMemo<ColumnDef<AdminShopOrder, unknown>[]>(
    () => [
      {
        header: 'Order',
        accessorKey: 'id',
        cell: ({ row }) => <span className="font-mono text-xs text-primary/80">{row.original.id.slice(0, 8)}…</span>,
      },
      {
        header: 'When',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        header: 'Customer',
        cell: ({ row }) => <span className="text-slate-300">{row.original.user?.email ?? row.original.user?.phoneMask ?? 'Guest'}</span>,
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
        cell: ({ row }) => {
          const statusId = `order-${row.original.id}-status`;
          const noteId = `order-${row.original.id}-note`;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={statusId} className="sr-only">
                  Update status for order {row.original.id}
                </Label>
                <Select defaultValue={row.original.status} onValueChange={(v) => void applyStatus(row.original.id, v)}>
                  <SelectTrigger id={statusId} className="h-8 w-40 bg-white/5 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['pending', 'ready', 'fulfilled', 'cancelled'] as const).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {statusLabels[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={noteId} className="sr-only">
                  Fulfillment note for order {row.original.id}
                </Label>
                <Input
                  id={noteId}
                  placeholder="Note"
                  value={noteDrafts[row.original.id] ?? ''}
                  onChange={(e) => setNoteDrafts((m) => ({ ...m, [row.original.id]: e.target.value }))}
                  className="h-8 w-40 bg-white/5"
                />
                <Button size="sm" variant="outline" onClick={() => void saveNote(row.original.id)}>
                  Add Note
                </Button>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Tracking',
        cell: ({ row }) => {
          const trackingId = `order-${row.original.id}-tracking`;
          return (
            <div className="flex items-center gap-2">
              <Label htmlFor={trackingId} className="sr-only">
                Tracking number for order {row.original.id}
              </Label>
              <Input
                id={trackingId}
                placeholder="Tracking #"
                value={trackingDrafts[row.original.id] ?? row.original.trackingNumber ?? ''}
                onChange={(e) => setTrackingDrafts((m) => ({ ...m, [row.original.id]: e.target.value }))}
                className="h-8 w-40 bg-white/5"
              />
              <Button size="sm" variant="outline" onClick={() => void saveTracking(row.original.id)}>
                Save
              </Button>
            </div>
          );
        },
      },
    ],
    [noteDrafts, trackingDrafts, applyStatus, saveNote, saveTracking],
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
        searchPlaceholder="Search order id/email"
        searchLabel="Search shop orders"
        caption="List of shop orders with status, fulfillment notes, and tracking controls"
      />
    </div>
  );
};
