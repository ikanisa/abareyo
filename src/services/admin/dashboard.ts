import { withAdminServiceClient } from '@/services/admin/service-client';

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

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  const now = new Date();
  const fallback = (): DashboardSnapshot => ({
    generatedAt: now.toISOString(),
    kpis: [
      { key: 'tickets', label: 'Tickets sold', value7d: 0, value30d: 0, trend: null, format: 'count' as const },
      { key: 'gmv', label: 'Shop GMV (RWF)', value7d: 0, value30d: 0, trend: null, format: 'currency' as const },
      { key: 'policies', label: 'Policies issued', value7d: 0, value30d: 0, trend: null, format: 'count' as const },
      { key: 'deposits', label: 'SACCO deposits (RWF)', value7d: 0, value30d: 0, trend: null, format: 'currency' as const },
    ],
    sms: { rawCount7d: 0, parsedCount7d: 0, successRate: null, averageLatencySeconds: null },
    payments: { confirmedCount7d: 0, pendingCount: 0, averageConfirmationSeconds: null },
    gates: { windowHours: 24, totalPasses: 0, breakdown: [] },
    alerts: [
      {
        id: 'supabase-config',
        severity: 'info',
        message: 'Configure Supabase URL and secret key to activate live metrics.',
      },
    ],
  });

  return withAdminServiceClient(
    async (client) => {
      const [kpiResponse, smsResponse, paymentResponse, gateResponse] = await Promise.all([
        client.from('admin_dashboard_kpis').select('metric, value_7d, value_30d, format'),
        client
          .from('admin_dashboard_sms_metrics')
          .select('raw_count_7d, parsed_count_7d, success_rate, average_latency_seconds')
          .maybeSingle(),
        client
          .from('admin_dashboard_payment_metrics')
          .select('confirmed_count_7d, pending_count, average_confirmation_seconds')
          .maybeSingle(),
        client.from('admin_dashboard_gate_throughput').select('gate, passes, window_hours'),
      ]);

      if (kpiResponse.error) throw kpiResponse.error;
      if (smsResponse.error) throw smsResponse.error;
      if (paymentResponse.error) throw paymentResponse.error;
      if (gateResponse.error) throw gateResponse.error;

      type KpiRow = {
        metric: string;
        value_7d: number | string | null;
        value_30d: number | string | null;
        format: 'count' | 'currency' | string;
      };

      type SmsMetricsRow = {
        raw_count_7d: number | string | null;
        parsed_count_7d: number | string | null;
        success_rate: number | null;
        average_latency_seconds: number | null;
      };

      type PaymentMetricsRow = {
        confirmed_count_7d: number | string | null;
        pending_count: number | string | null;
        average_confirmation_seconds: number | null;
      };

      type GateMetricsRow = {
        gate: string | null;
        passes: number | string | null;
        window_hours: number | null;
      };

      const kpiRows = (kpiResponse.data ?? []) as unknown as KpiRow[];
      const smsRow = (smsResponse.data ?? null) as SmsMetricsRow | null;
      const paymentRow = (paymentResponse.data ?? null) as PaymentMetricsRow | null;
      const gateRows = (gateResponse.data ?? []) as unknown as GateMetricsRow[];

      const kpiMap = new Map(
        kpiRows.map((row) => [row.metric, { ...row, format: row.format === 'currency' ? 'currency' : 'count' }]),
      );

      const parseNumeric = (value: number | string | null | undefined) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = Number(value);
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const smsRawCount = parseNumeric(smsRow?.raw_count_7d);
      const smsParsedCount = parseNumeric(smsRow?.parsed_count_7d);
      const smsSuccessRate = smsRow?.success_rate ?? (smsRawCount === 0 ? null : smsParsedCount / smsRawCount);
      const smsAverageLatency = smsRow?.average_latency_seconds ?? null;

      const confirmedPayments7 = parseNumeric(paymentRow?.confirmed_count_7d);
      const pendingOrders = parseNumeric(paymentRow?.pending_count);
      const paymentAverage = paymentRow?.average_confirmation_seconds ?? null;

      const gateBreakdown = gateRows
        .map((row) => ({ gate: row.gate ?? 'Unassigned', passes: parseNumeric(row.passes) }))
        .sort((a, b) => b.passes - a.passes);
      const gateTotal = sumValues(gateBreakdown.map((entry) => entry.passes));
      const windowHours = gateRows.length ? gateRows[0].window_hours ?? 24 : 24;

      const computeTrend = (value7: number, value30: number) => {
        if (!value30) return null;
        const dailyAverage30 = value30 / 30;
        const projected7From30 = dailyAverage30 * 7;
        return value7 - projected7From30;
      };

      const KPI_LABELS: Record<string, string> = {
        tickets: 'Tickets sold',
        gmv: 'Shop GMV (RWF)',
        policies: 'Policies issued',
        deposits: 'SACCO deposits (RWF)',
      };

      const orderedKeys: Array<keyof typeof KPI_LABELS> = ['tickets', 'gmv', 'policies', 'deposits'];

      const kpis: Kpi[] = orderedKeys.map((key) => {
        const row = kpiMap.get(key) ?? null;
        const value7d = row ? parseNumeric(row.value_7d) : 0;
        const value30d = row ? parseNumeric(row.value_30d) : 0;
        return {
          key,
          label: KPI_LABELS[key],
          value7d,
          value30d,
          trend: computeTrend(value7d, value30d),
          format: row?.format === 'currency' ? 'currency' : 'count',
        };
      });

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
          windowHours,
          totalPasses: gateTotal,
          breakdown: gateBreakdown.slice(0, 5),
        },
        alerts,
      };
    },
    { fallback },
  );
};
