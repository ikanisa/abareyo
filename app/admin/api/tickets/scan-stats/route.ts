import { NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';
import type { Tables } from '@/integrations/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey);
};

type StatusSummary = Array<{ status: string; count: number }>;
type GateThroughput = Array<{ gate: string; perMin: number; samples: number }>;
type TicketPassRecord = { gate?: string | null };

const KNOWN_TICKET_STATUSES: readonly Tables<'ticket_orders'>['status'][] = [
  'pending',
  'paid',
  'cancelled',
  'expired',
] as const;

const isKnownTicketStatus = (
  value: string,
): value is Tables<'ticket_orders'>['status'] =>
  KNOWN_TICKET_STATUSES.includes(value as Tables<'ticket_orders'>['status']);

export async function GET() {
  try {
    await requireAdminSession();
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'supabase_not_configured', passes: 0, orders: 0, statusSummary: [], throughputPerGate: [] },
        { status: 503, headers: { 'x-admin-offline': 'supabase-missing' } },
      );
    }
    const supabase = getSupabaseAdmin();

    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Grouped status counts
    const statusSummaryPromise = supabase
      .from('ticket_orders')
      .select('status, count:id', { head: false })
      .group('status');

    const [passesCount, ordersCount, statusSummary, recentPasses] = await Promise.all([
      supabase.from('ticket_passes').select('id', { count: 'exact', head: true }),
      supabase.from('ticket_orders').select('id', { count: 'exact', head: true }),
      statusSummaryPromise,
      supabase.from('ticket_passes').select('gate, created_at').gte('created_at', sinceIso),
    ]);

    if (passesCount.error) throw passesCount.error;
    if (ordersCount.error) throw ordersCount.error;
    if (statusSummary.error) throw statusSummary.error;
    if (recentPasses.error) throw recentPasses.error;

    // Use the aggregated `count` returned by Supabase, not just number of rows.
    const statusAggregateByKey = new Map<string, { status: string; count: number }>();
    for (const row of statusSummary.data ?? []) {
      const parsed = row as { status?: string | null; count?: number | null };
      const key = parsed.status ?? 'unknown';
      const total =
        typeof parsed.count === 'number' ? parsed.count : Number(parsed.count ?? 0);
      statusAggregateByKey.set(key, { status: key, count: total });
    }

    const statusAggregate: StatusSummary = [
      // Known statuses in stable order
      ...KNOWN_TICKET_STATUSES.map((status) =>
        statusAggregateByKey.get(status) ?? { status, count: 0 },
      ),
      // Any extra statuses we don't recognize
      ...Array.from(statusAggregateByKey.entries())
        .filter(([status]) => !isKnownTicketStatus(status))
        .map(([, value]) => value),
    ];

    // Throughput per gate over last hour
    const gateTotals = (recentPasses.data ?? []).reduce<Record<string, { gate: string; total: number }>>(
      (acc, record: TicketPassRecord) => {
        const gate = record.gate && record.gate.length > 0 ? record.gate : 'Unassigned';
        acc[gate] = acc[gate] ? { gate, total: acc[gate].total + 1 } : { gate, total: 1 };
        return acc;
      },
      {},
    );

    const throughputByGate: GateThroughput = Object.values(gateTotals).map(({ gate, total }) => ({
      gate,
      perMin: Number((total / 60).toFixed(2)),
      samples: total,
    }));

    const response = {
      passes: passesCount.count ?? 0,
      orders: ordersCount.count ?? 0,
      statusSummary: statusAggregate,
      throughputPerGate: throughputByGate,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to compute scan dashboard stats', error);
    return NextResponse.json({ error: 'scan_stats_failed' }, { status: 500 });
  }
}
