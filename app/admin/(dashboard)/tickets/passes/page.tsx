'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  AdminTicketMatch,
  AdminTicketPass,
  listAdminTicketMatches,
  listAdminTicketPasses,
  updateAdminTicketOrder,
} from '@/lib/api/admin/ticket-console';

import { CreatePassDialog } from './CreatePassDialog';

const PASS_STATES = ['all', 'active', 'used', 'refunded'] as const;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type PassStateFilter = (typeof PASS_STATES)[number];

export default function AdminTicketPassesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<PassStateFilter>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const matchesQuery = useQuery({
    queryKey: ['admin', 'tickets', 'matches'],
    queryFn: () => listAdminTicketMatches(false),
  });

  const passesQuery = useQuery({
    queryKey: ['admin', 'tickets', 'passes', { matchFilter, stateFilter, debounced }],
    queryFn: () =>
      listAdminTicketPasses({
        matchId: matchFilter === 'all' ? undefined : matchFilter,
        state: stateFilter === 'all' ? undefined : stateFilter,
        q: debounced || undefined,
      }),
  });

  const markUsedMutation = useMutation({
    mutationFn: (pass: AdminTicketPass) =>
      updateAdminTicketOrder({ id: pass.order_id, status: 'paid' }),
    onSuccess: () => {
      toast({ title: 'Order refreshed' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'passes'] }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'orders'] }).catch(() => undefined);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update order';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
  });

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);
  const passes = useMemo(() => passesQuery.data ?? [], [passesQuery.data]);

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
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
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">State</label>
            <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as PassStateFilter)}>
              <SelectTrigger className="mt-1 bg-slate-900/60 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100">
                {PASS_STATES.map((state) => (
                  <SelectItem key={state} value={state} className="capitalize">
                    {state}
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
              placeholder="Pass ID or zone"
              className="mt-1 bg-slate-900/60 text-slate-100"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Issued passes</h2>
        <Button onClick={() => setDialogOpen(true)}>Manual issue</Button>
      </div>

      {passesQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : passes.length === 0 ? (
        <GlassCard className="p-6 text-center text-sm text-slate-400">No passes issued yet.</GlassCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {passes.map((pass) => (
            <GlassCard key={pass.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold text-slate-100">Pass {pass.id.slice(0, 8)}</div>
                  <div className="text-xs text-slate-400">
                    Created {dateFormatter.format(new Date(pass.created_at))}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-xs capitalize text-slate-100">
                  {pass.state}
                </Badge>
              </div>
              <div className="text-sm text-slate-200">
                Zone {pass.zone ?? 'TBD'} · Gate {pass.gate ?? 'TBD'}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
                <div>Order {pass.order?.id ?? 'unknown'}</div>
                {pass.order?.match ? (
                  <div>
                    {pass.order.match.title} · {new Date(pass.order.match.date).toLocaleDateString()}
                  </div>
                ) : (
                  <div>Unassigned match</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markUsedMutation.mutate(pass)}
                  disabled={markUsedMutation.isPending}
                >
                  Refresh order
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <CreatePassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', 'passes'] }).catch(() => undefined);
        }}
      />
    </div>
  );
}
