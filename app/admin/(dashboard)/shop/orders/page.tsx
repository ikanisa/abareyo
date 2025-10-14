'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, PackageCheck, ShoppingBag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  AdminShopOrder,
  listAdminShopOrders,
  updateAdminShopOrder,
} from '@/lib/api/admin/shop-console';

const SHOP_STATUS_OPTIONS = ['all', 'pending', 'paid', 'ready', 'pickedup'] as const;

type ShopStatus = (typeof SHOP_STATUS_OPTIONS)[number];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'paid',
  paid: 'ready',
  ready: 'pickedup',
  pickedup: null,
};

export default function AdminShopOrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<ShopStatus>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const ordersQuery = useQuery({
    queryKey: ['admin', 'shop', 'orders', { statusFilter, debounced }],
    queryFn: () =>
      listAdminShopOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        q: debounced || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { id: string; status?: string }) => updateAdminShopOrder(payload),
    onSuccess: () => {
      toast({ title: 'Order updated' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop', 'orders'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update order';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ShopStatus)}>
              <SelectTrigger className="mt-1 bg-slate-900/60 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100">
                {SHOP_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Search</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order ID or reference"
              className="mt-1 bg-slate-900/60 text-slate-100"
            />
          </div>
        </div>
      </GlassCard>

      {ordersQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <GlassCard className="p-6 text-center text-sm text-slate-400">No shop orders yet.</GlassCard>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextStatus = NEXT_STATUS[order.status] ?? null;
            return (
              <GlassCard key={order.id} className="space-y-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                      Order {order.id.slice(0, 8)}
                      <Badge variant="secondary" className="bg-white/10 text-xs capitalize text-slate-100">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-300">
                      Total {order.total.toLocaleString()} RWF · {order.items.length} items
                    </div>
                    <div className="text-xs text-slate-400">
                      Created {dateFormatter.format(new Date(order.created_at))}
                    </div>
                    {order.user?.phone && <div className="text-xs text-slate-400">Customer {order.user.phone}</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: nextStatus })}
                        disabled={updateStatusMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {nextStatus === 'paid' && <CheckCircle2 className="h-4 w-4" />}
                        {nextStatus === 'ready' && <PackageCheck className="h-4 w-4" />}
                        {nextStatus === 'pickedup' && <ShoppingBag className="h-4 w-4" />}
                        Mark {nextStatus}
                      </Button>
                    )}
                    {order.status !== 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'pending' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Reset to pending
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
                  <div className="text-slate-200">Items</div>
                  <ul className="mt-2 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span>{item.product.name}</span>
                        <span>
                          {item.qty} × {item.price.toLocaleString()} RWF
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
