import { fetchDashboardSnapshot } from '@/services/admin/dashboard';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'RWF',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const formatValue = (value: number, format: 'count' | 'currency') => {
  if (format === 'currency') {
    return currencyFormatter.format(value);
  }
  return numberFormatter.format(value);
};

const AdminOverviewPage = async () => {
  const snapshot = await fetchDashboardSnapshot();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {snapshot.kpis.map((card) => {
          const trend = card.trend ?? 0;
          const isPositive = trend > 0;
          const isNegative = trend < 0;
          const formattedTrend = card.trend === null
            ? null
            : card.format === 'currency'
            ? currencyFormatter.format(trend)
            : numberFormatter.format(Math.abs(trend));
          const trendLabel = (() => {
            if (card.trend === null) return null;
            if (trend === 0) return 'On projection';
            if (!formattedTrend) return null;
            if (card.format === 'currency') {
              return `${formattedTrend} vs projection`;
            }
            return `${isPositive ? '+' : '-'}${formattedTrend} vs projection`;
          })();

          return (
            <div
              key={card.key}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-primary/5"
            >
              <div className="text-xs uppercase tracking-wide text-slate-400">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">
                {formatValue(card.value7d, card.format)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Last 7 days</span>
                <span>
                  30d: {formatValue(card.value30d, card.format)}
                </span>
              </div>
              {trendLabel && (
                <div
                  className={`mt-2 text-xs font-medium ${
                    isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {trendLabel}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-slate-100">SMS Parser Health</h2>
          <p className="mt-2 text-sm text-slate-400">
            {snapshot.sms.successRate === null
              ? 'No inbound SMS records in the last 7 days.'
              : `Success rate ${(snapshot.sms.successRate * 100).toFixed(1)}% across ${numberFormatter.format(
                  snapshot.sms.rawCount7d,
                )} messages.`}
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Parsed</span>
              <span>{numberFormatter.format(snapshot.sms.parsedCount7d)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg latency</span>
              <span>
                {snapshot.sms.averageLatencySeconds === null
                  ? '—'
                  : `${Math.round(snapshot.sms.averageLatencySeconds)}s`}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-slate-100">Payment SLA</h2>
          <p className="mt-2 text-sm text-slate-400">
            Tracking reconciliation speed across ticket and shop payments.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Confirmed (7d)</span>
              <span>{numberFormatter.format(snapshot.payments.confirmedCount7d)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending queue</span>
              <span className={snapshot.payments.pendingCount ? 'text-amber-300' : undefined}>
                {numberFormatter.format(snapshot.payments.pendingCount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg confirmation</span>
              <span>
                {snapshot.payments.averageConfirmationSeconds === null
                  ? '—'
                  : `${Math.round(snapshot.payments.averageConfirmationSeconds / 60)} min`}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-slate-100">Gate Throughput</h2>
          <p className="mt-2 text-sm text-slate-400">
            Pass issuance activity over the last {snapshot.gates.windowHours}-hour window.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Total passes</span>
              <span>{numberFormatter.format(snapshot.gates.totalPasses)}</span>
            </div>
            {snapshot.gates.breakdown.map((gate) => (
              <div key={gate.gate} className="flex items-center justify-between text-xs text-slate-400">
                <span>{gate.gate}</span>
                <span>{numberFormatter.format(gate.passes)}</span>
              </div>
            ))}
            {!snapshot.gates.breakdown.length && (
              <div className="text-xs text-slate-500">No gate activity recorded.</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Operational Alerts</h2>
          <span className="text-xs text-slate-500">Refreshed {new Date(snapshot.generatedAt).toLocaleString()}</span>
        </div>
        {snapshot.alerts.length ? (
          <ul className="mt-4 space-y-2">
            {snapshot.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-xl border p-3 text-sm ${
                  alert.severity === 'critical'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-100'
                    : alert.severity === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                    : 'border-slate-500/40 bg-slate-500/10 text-slate-100'
                }`}
              >
                <div className="text-xs uppercase tracking-wide opacity-80">{alert.severity}</div>
                <div className="mt-1 font-medium">{alert.message}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-400">All systems nominal. No alerts triggered in the last refresh.</p>
        )}
      </section>
    </div>
  );
};

export default AdminOverviewPage;
