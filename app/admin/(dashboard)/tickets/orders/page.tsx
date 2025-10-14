'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailPlus, RefreshCw } from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import {
  AdminTicketMatch,
  AdminTicketOrder,
  createAdminTicketPass,
  listAdminTicketMatches,
  listAdminTicketOrders,
  updateAdminTicketOrder,
} from '@/lib/api/admin/ticket-console';

import { AttachSmsDialog } from './AttachSmsDialog';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const statusOptions = ['all', 'pending', 'paid', 'cancelled', 'expired'] as const;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type StatusFilter = (typeof statusOptions)[number];

export default function AdminTicketOrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminTicketOrder | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const matchesQuery = useQuery({
    queryKey: ['admin', 'tickets', 'matches'],
    queryFn: () => listAdminTicketMatches(false),
  });

  const ordersQuery = useQuery({
    queryKey: ['admin', 'tickets', 'orders', { statusFilter, matchFilter, debouncedSearch }],
    queryFn: () =>
      listAdminTicketOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        matchId: matchFilter === 'all' ? undefined : matchFilter,
        q: debouncedSearch || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { id: string; status?: string; momo_ref?: string | null }) => updateAdminTicketOrder(payload),
    onSuccess: () => {
      toast({ title: 'Order updated' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'orders'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update order';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
  });

  const createPassMutation = useMutation({
    mutationFn: (orderId: string) => createAdminTicketPass({ order_id: orderId }),
    onSuccess: () => {
      toast({ title: 'Pass issued' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'orders'] }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'passes'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to create pass';
      toast({ title: 'Pass creation failed', description: message, variant: 'destructive' });
    },
  });

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <GlassCard className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="mt-1 bg-slate-900/60 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-slate-100">
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Match</label>
              <Select value={matchFilter} onValueChange={setMatchFilter}>
                <SelectTrigger className="mt-1 bg-slate-900/60 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-slate-100">
                  <SelectItem value="all">All matches</SelectItem>
                  {matches.map((match: AdminTicketMatch) => (
                    <SelectItem key={match.id} value={match.id}>
                      {match.title}
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
                placeholder="Order ID or MoMo reference"
                className="mt-1 bg-slate-900/60 text-slate-100"
              />
            </div>
          </div>
        </GlassCard>

        {ordersQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <GlassCard className="p-6 text-center text-sm text-slate-400">No orders found for the selected filters.</GlassCard>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <GlassCard key={order.id} className="space-y-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                      Order {order.id.slice(0, 8)}
                      <Badge variant="secondary" className="bg-white/10 text-xs capitalize text-slate-100">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-300">
                      {order.match ? (
                        <span>
                          {order.match.title} · {new Date(order.match.date).toLocaleDateString()} · {order.match.venue ?? 'Venue TBA'}
                        </span>
                      ) : (
                        <span>Unassigned match</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      Created {dateFormatter.format(new Date(order.created_at))}
                      {order.expires_at ? ` · Expires ${dateFormatter.format(new Date(order.expires_at))}` : ''}
                    </div>
                    <div className="text-sm text-slate-200">
                      Total {order.total.toLocaleString()} RWF · MoMo ref {order.momo_ref ?? '—'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-2"
                    >
                      <MailPlus className="h-4 w-4" /> Attach SMS
                    </Button>
                    {order.status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'paid' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark paid
                      </Button>
                    )}
                    {order.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'orders'] })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh order</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="font-semibold text-slate-100">Payment activity</div>
                  {order.payments.length === 0 ? (
                    <div className="text-xs text-slate-400">No payments linked yet.</div>
                  ) : (
                    <ul className="mt-2 space-y-1 text-xs">
                      {order.payments.map((payment) => (
                        <li key={payment.id} className="flex items-center justify-between text-slate-300">
                          <span>{payment.status}</span>
                          <span>{payment.amount.toLocaleString()} RWF</span>
                          <span>{dateFormatter.format(new Date(payment.created_at))}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {order.passes.length > 0 ? (
                    <span>{order.passes.length} passes issued.</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createPassMutation.mutate(order.id)}
                      disabled={createPassMutation.isPending}
                    >
                      Issue pass
                    </Button>
                  )}
                  {order.user?.phone && <span>Fan: {order.user.phone}</span>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        <AttachSmsDialog
          open={Boolean(selectedOrder)}
          onOpenChange={(next) => {
            if (!next) setSelectedOrder(null);
          }}
          order={selectedOrder}
          onAttached={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'orders'] }).catch(() => undefined);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
