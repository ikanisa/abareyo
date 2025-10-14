import { NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

type StatusSummary = Array<{ status: string; count: number }>;
type GateThroughput = Array<{ gate: string; perMin: number; samples: number }>;

export async function GET() {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();

    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Grouped status counts
    const statusSummaryPromise = supabase
      .from('ticket_orders')
      // Use PostgREST aggregate with alias and group by status
      .select('status, count:status', { head: false })
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

    const statusAggregate: StatusSummary = (statusSummary.data ?? []).map((row: any) => ({
      status: row.status ?? 'unknown',
      count: Number(row.count ?? 0),
    }));

    const throughputByGate: GateThroughput = Object.values(
      (recentPasses.data ?? []).reduce<Record<string, { gate: string; total: number }>>((acc, record: any) => {
        const gate = record.gate ?? 'Unassigned';
        acc[gate] = acc[gate] ? { gate, total: acc[gate]!.total + 1 } : { gate, total: 1 };
        return acc;
      }, {}),
    ).map(({ gate, total }) => ({
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
