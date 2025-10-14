import { getServiceClient } from '@/app/api/admin/_lib/db';

type Kpi = {
  key: string;
  label: string;
  value7d: number;
  value30d: number;
  trend: number | null;
  format: 'count' | 'currency';
};

type SmsTelemetry = {
  rawCount7d: number;
  parsedCount7d: number;
  successRate: number | null;
  averageLatencySeconds: number | null;
};

type PaymentTelemetry = {
  confirmedCount7d: number;
  pendingCount: number;
  averageConfirmationSeconds: number | null;
};

type SmsLatencyRow = {
  created_at: string;
  sms_raw: { received_at: string | null } | null;
};

type PaymentLatencyRow = {
  created_at: string;
  ticket_orders: { created_at: string | null } | null;
  orders: { created_at: string | null } | null;
};

type GateTelemetry = {
  windowHours: number;
  totalPasses: number;
  breakdown: Array<{ gate: string; passes: number }>;
};

type Alert = {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
};

export type DashboardSnapshot = {
  generatedAt: string;
  kpis: Kpi[];
  sms: SmsTelemetry;
  payments: PaymentTelemetry;
  gates: GateTelemetry;
  alerts: Alert[];
};

const sumValues = (values: Array<number | null | undefined>) => {
  let total = 0;
  for (const value of values) {
    if (typeof value === 'number') {
      total += value;
    }
  }
  return total;
};

const average = (values: number[]) => {
  if (!values.length) return null;
  const total = values.reduce((acc, value) => acc + value, 0);
  return total / values.length;
};

const toSeconds = (start: string | null | undefined, end: string | null | undefined) => {
  if (!start || !end) return null;
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return null;
  return Math.max(0, (endDate - startDate) / 1000);
};

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  const now = new Date();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'tickets', label: 'Tickets sold', value7d: 0, value30d: 0, trend: null, format: 'count' },
        { key: 'gmv', label: 'Shop GMV (RWF)', value7d: 0, value30d: 0, trend: null, format: 'currency' },
        { key: 'policies', label: 'Policies issued', value7d: 0, value30d: 0, trend: null, format: 'count' },
        { key: 'deposits', label: 'SACCO deposits (RWF)', value7d: 0, value30d: 0, trend: null, format: 'currency' },
      ],
      sms: { rawCount7d: 0, parsedCount7d: 0, successRate: null, averageLatencySeconds: null },
      payments: { confirmedCount7d: 0, pendingCount: 0, averageConfirmationSeconds: null },
      gates: { windowHours: 24, totalPasses: 0, breakdown: [] },
      alerts: [
        {
          id: 'supabase-config',
          severity: 'info',
          message: 'Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to activate live metrics.',
        },
      ],
    };
  }

  const client = getServiceClient();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    tickets7d,
    tickets30d,
    shop7d,
    shop30d,
    policies7d,
    policies30d,
    deposits7d,
    deposits30d,
    smsRaw7d,
    smsParsed7d,
    smsLatencyRows,
    paymentRows,
    pendingTicketOrders,
    pendingShopOrders,
    gateRows,
  ] = await Promise.all([
    client
      .from('ticket_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gte('created_at', sevenDaysAgo),
    client
      .from('ticket_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gte('created_at', thirtyDaysAgo),
    client
      .from('orders')
      .select('sum:total.sum()', { head: false })
      .in('status', ['paid', 'ready', 'pickedup'])
      .gte('created_at', sevenDaysAgo)
      .maybeSingle(),
    client
      .from('orders')
      .select('sum:total.sum()', { head: false })
      .in('status', ['paid', 'ready', 'pickedup'])
      .gte('created_at', thirtyDaysAgo)
      .maybeSingle(),
    client
      .from('insurance_quotes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'issued')
      .gte('created_at', sevenDaysAgo),
    client
      .from('insurance_quotes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'issued')
      .gte('created_at', thirtyDaysAgo),
    client
      .from('sacco_deposits')
      .select('sum:amount.sum()', { head: false })
      .eq('status', 'confirmed')
      .gte('created_at', sevenDaysAgo)
      .maybeSingle(),
    client
      .from('sacco_deposits')
      .select('sum:amount.sum()', { head: false })
      .eq('status', 'confirmed')
      .gte('created_at', thirtyDaysAgo)
      .maybeSingle(),
    client
      .from('sms_raw')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', sevenDaysAgo),
    client
      .from('sms_parsed')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    client
      .from('sms_parsed')
      .select('created_at, sms_raw:sms_raw(received_at)')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('payments')
      .select(
        'created_at, ticket_orders:ticket_order_id(created_at), orders:order_id(created_at)'
      )
      .eq('status', 'confirmed')
      .gte('created_at', sevenDaysAgo)
      .limit(200),
    client
      .from('ticket_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('ticket_passes')
      .select('gate, created_at')
      .gte('created_at', twentyFourHoursAgo)
      .limit(500),
  ]);

  if (tickets7d.error) throw tickets7d.error;
  if (tickets30d.error) throw tickets30d.error;
  if (shop7d.error) throw shop7d.error;
  if (shop30d.error) throw shop30d.error;
  if (policies7d.error) throw policies7d.error;
  if (deposits7d.error) throw deposits7d.error;
  if (policies30d.error) throw policies30d.error;
  if (deposits30d.error) throw deposits30d.error;
  if (smsRaw7d.error) throw smsRaw7d.error;
  if (smsParsed7d.error) throw smsParsed7d.error;
  if (smsLatencyRows.error) throw smsLatencyRows.error;
  if (paymentRows.error) throw paymentRows.error;
  if (pendingTicketOrders.error) throw pendingTicketOrders.error;
  if (pendingShopOrders.error) throw pendingShopOrders.error;
  if (gateRows.error) throw gateRows.error;

  const tickets7Count = tickets7d.count ?? 0;
  const tickets30Count = tickets30d.count ?? 0;
  const shop7Total = Number((shop7d.data as { sum?: number } | null)?.sum ?? 0);
  const shop30Total = Number((shop30d.data as { sum?: number } | null)?.sum ?? 0);
  const policiesIssued7 = policies7d.count ?? 0;
  const policiesIssued30 = policies30d.count ?? policiesIssued7;
  const depositsConfirmed7 = Number((deposits7d.data as { sum?: number } | null)?.sum ?? 0);
  const depositsConfirmed30 = Number((deposits30d.data as { sum?: number } | null)?.sum ?? depositsConfirmed7);

  const smsRawCount = smsRaw7d.count ?? 0;
  const smsParsedCount = smsParsed7d.count ?? 0;
  const smsSuccessRate = smsRawCount === 0 ? null : smsParsedCount / smsRawCount;
  const smsLatencyRowsData = (smsLatencyRows.data ?? []) as unknown as SmsLatencyRow[];
  const smsLatencyValues = smsLatencyRowsData
    .map((row) => toSeconds(row.sms_raw?.received_at, row.created_at) ?? null)
    .filter((value): value is number => value !== null);
  const smsAverageLatency = average(smsLatencyValues);

  const paymentRowsData = (paymentRows.data ?? []) as unknown as PaymentLatencyRow[];
  const paymentDurations = paymentRowsData
    .map((row) => {
      const orderCreatedAt = row.ticket_orders?.created_at ?? row.orders?.created_at ?? null;
      return toSeconds(orderCreatedAt, row.created_at);
    })
    .filter((value): value is number => value !== null);
  const paymentAverage = average(paymentDurations);
  const confirmedPayments7 = (paymentRows.data ?? []).length;
  const pendingOrders = (pendingTicketOrders.count ?? 0) + (pendingShopOrders.count ?? 0);

  const gateMap = new Map<string, number>();
  for (const row of gateRows.data ?? []) {
    const gate = row.gate ?? 'Unassigned';
    gateMap.set(gate, (gateMap.get(gate) ?? 0) + 1);
  }
  const gateBreakdown = Array.from(gateMap.entries())
    .map(([gate, passes]) => ({ gate, passes }))
    .sort((a, b) => b.passes - a.passes);
  const gateTotal = sumValues(gateBreakdown.map((entry) => entry.passes));

  const computeTrend = (value7: number, value30: number) => {
    if (!value30) return null;
    const dailyAverage30 = value30 / 30;
    const projected7From30 = dailyAverage30 * 7;
    return value7 - projected7From30;
  };

  const kpis: Kpi[] = [
    {
      key: 'tickets',
      label: 'Tickets sold',
      value7d: tickets7Count,
      value30d: tickets30Count,
      trend: computeTrend(tickets7Count, tickets30Count),
      format: 'count',
    },
    {
      key: 'gmv',
      label: 'Shop GMV (RWF)',
      value7d: shop7Total,
      value30d: shop30Total,
      trend: computeTrend(shop7Total, shop30Total),
      format: 'currency',
    },
    {
      key: 'policies',
      label: 'Policies issued',
      value7d: policiesIssued7,
      value30d: policiesIssued30,
      trend: null,
      format: 'count',
    },
    {
      key: 'deposits',
      label: 'SACCO deposits (RWF)',
      value7d: depositsConfirmed7,
      value30d: depositsConfirmed30,
      trend: null,
      format: 'currency',
    },
  ];

  const alerts: Alert[] = [];
  if (smsSuccessRate !== null && smsSuccessRate < 0.75) {
    alerts.push({
      id: 'sms-success',
      severity: 'warning',
      message: `SMS parse success is at ${(smsSuccessRate * 100).toFixed(1)}% over the last 7 days.`,
    });
  }
  if (smsAverageLatency !== null && smsAverageLatency > 300) {
    alerts.push({
      id: 'sms-latency',
      severity: 'warning',
      message: `Average parser latency is ${(smsAverageLatency / 60).toFixed(1)} minutes.`,
    });
  }
  if (paymentAverage !== null && paymentAverage > 900) {
    alerts.push({
      id: 'payment-latency',
      severity: 'critical',
      message: `Payment confirmations are averaging ${(paymentAverage / 60).toFixed(1)} minutes.`,
    });
  }
  if (pendingOrders > 0) {
    alerts.push({
      id: 'pending-orders',
      severity: 'info',
      message: `${pendingOrders} orders are still pending payment reconciliation.`,
    });
  }

  return {
    generatedAt: now.toISOString(),
    kpis,
    sms: {
      rawCount7d: smsRawCount,
      parsedCount7d: smsParsedCount,
      successRate: smsSuccessRate,
      averageLatencySeconds: smsAverageLatency,
    },
    payments: {
      confirmedCount7d: confirmedPayments7,
      pendingCount: pendingOrders,
      averageConfirmationSeconds: paymentAverage,
    },
    gates: {
      windowHours: 24,
      totalPasses: gateTotal,
      breakdown: gateBreakdown.slice(0, 5),
    },
    alerts,
  };
};
