'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Ticket, Users } from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTicketScanStats } from '@/lib/api/admin/ticket-console';

const numberFormatter = new Intl.NumberFormat('en-US');

export default function AdminTicketScanPage() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'tickets', 'scan-stats'],
    queryFn: fetchTicketScanStats,
    refetchInterval: 30_000,
  });

  if (statsQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const stats = statsQuery.data;
  if (!stats) {
    return <GlassCard className="p-6 text-center text-sm text-slate-400">Unable to load scan metrics.</GlassCard>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="space-y-2 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Total passes</span>
            <Ticket className="h-4 w-4" />
          </div>
          <div className="text-3xl font-semibold text-slate-100">{numberFormatter.format(stats.passes)}</div>
        </GlassCard>
        <GlassCard className="space-y-2 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Orders</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="text-3xl font-semibold text-slate-100">{numberFormatter.format(stats.orders)}</div>
        </GlassCard>
        <GlassCard className="space-y-2 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Paid orders</span>
            <Activity className="h-4 w-4" />
          </div>
          <div className="text-3xl font-semibold text-slate-100">
            {numberFormatter.format(stats.statusSummary.find((entry) => entry.status === 'paid')?.count ?? 0)}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-lg font-semibold text-slate-100">Gate throughput (last hour)</h2>
        {stats.throughputPerGate.length === 0 ? (
          <div className="mt-3 text-sm text-slate-400">No recent scans recorded.</div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {stats.throughputPerGate.map((gate) => (
              <div key={gate.gate} className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{gate.gate}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-100">{gate.perMin} / min</div>
                <div className="text-xs text-slate-400">{gate.samples} scans past hour</div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
