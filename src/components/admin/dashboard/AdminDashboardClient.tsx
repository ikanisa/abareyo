'use client';

import { useMemo } from 'react';

import type { DashboardSnapshot } from '@/services/admin/dashboard';
import { useAdminLocale } from '@/providers/admin-locale-provider';

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

type AdminDashboardClientProps = {
  snapshot: DashboardSnapshot;
};

export const AdminDashboardClient = ({ snapshot }: AdminDashboardClientProps) => {
  const { t } = useAdminLocale();
  const kpiCards = useMemo(() => {
    const vsProjection = t('admin.dashboard.kpi.trend.vsProjection', 'vs projection');
    const onProjection = t('admin.dashboard.kpi.trend.onProjection', 'On projection');
    return snapshot.kpis.map((card) => {
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
        if (trend === 0) return onProjection;
        if (!formattedTrend) return null;
        if (card.format === 'currency') {
          return `${formattedTrend} ${vsProjection}`;
        }
        return `${isPositive ? '+' : '-'}${formattedTrend} ${vsProjection}`;
      })();

      return {
        ...card,
        isPositive,
        isNegative,
        trendLabel,
        label: t(`admin.dashboard.kpi.${card.key}`, card.label),
      };
    });
  }, [snapshot.kpis, t]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-primary/5"
          >
            <div className="type-caption text-slate-300/80">{card.label}</div>
            <div className="mt-3 text-heading-lg text-slate-50">
              {formatValue(card.value7d, card.format)}
            </div>
            <div className="mt-3 flex items-center justify-between text-caption text-slate-400/90">
              <span className="text-caption">
                {t('admin.dashboard.kpi.range.sevenDay', 'Last 7 days')}
              </span>
              <span className="text-caption">
                {t('admin.dashboard.kpi.range.thirtyDay', '30d')}
                : {formatValue(card.value30d, card.format)}
              </span>
            </div>
            {card.trendLabel && (
              <div
                className={`mt-3 text-body-sm font-medium ${
                  card.isPositive ? 'text-emerald-300' : card.isNegative ? 'text-rose-300' : 'text-slate-300'
                }`}
              >
                {card.trendLabel}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-heading-md text-slate-100">
            {t('admin.dashboard.sms.title', 'SMS Parser Health')}
          </h2>
          <p className="mt-3 max-w-prose text-body-sm text-slate-300/90">
            {snapshot.sms.successRate === null
              ? t('admin.dashboard.sms.empty', 'No inbound SMS records in the last 7 days.')
              : t(
                  'admin.dashboard.sms.summary',
                  `Success rate ${(snapshot.sms.successRate * 100).toFixed(1)}% across ${numberFormatter.format(
                    snapshot.sms.rawCount7d,
                  )} messages.`,
                )}
          </p>
          <div className="mt-5 space-y-2 text-body-sm text-slate-100/90">
            <div className="flex items-center justify-between">
              <span>{t('admin.dashboard.sms.parsed', 'Parsed')}</span>
              <span>{numberFormatter.format(snapshot.sms.parsedCount7d)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('admin.dashboard.sms.latency', 'Avg latency')}</span>
              <span>
                {snapshot.sms.averageLatencySeconds === null
                  ? '—'
                  : `${Math.round(snapshot.sms.averageLatencySeconds)}${t(
                      'admin.dashboard.sms.secondsSuffix',
                      's',
                    )}`}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-heading-md text-slate-100">
            {t('admin.dashboard.payments.title', 'Payment SLA')}
          </h2>
          <p className="mt-3 max-w-prose text-body-sm text-slate-300/90">
            {t('admin.dashboard.payments.subtitle', 'Tracking reconciliation speed across ticket and shop payments.')}
          </p>
          <div className="mt-5 space-y-2 text-body-sm text-slate-100/90">
            <div className="flex items-center justify-between">
              <span>{t('admin.dashboard.payments.confirmed', 'Confirmed (7d)')}</span>
              <span>{numberFormatter.format(snapshot.payments.confirmedCount7d)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('admin.dashboard.payments.pendingQueue', 'Pending queue')}</span>
              <span className={snapshot.payments.pendingCount ? 'text-amber-300' : undefined}>
                {numberFormatter.format(snapshot.payments.pendingCount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('admin.dashboard.payments.avgConfirmation', 'Avg confirmation')}</span>
              <span>
                {snapshot.payments.averageConfirmationSeconds === null
                  ? '—'
                  : `${Math.round(snapshot.payments.averageConfirmationSeconds / 60)} ${t(
                      'admin.dashboard.payments.minutesSuffix',
                      'min',
                    )}`}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-heading-md text-slate-100">
            {t('admin.dashboard.gates.title', 'Gate Throughput')}
          </h2>
          <p className="mt-3 max-w-prose text-body-sm text-slate-300/90">
            {t(
              'admin.dashboard.gates.subtitle',
              `Pass issuance activity over the last ${snapshot.gates.windowHours}-hour window.`,
            )}
          </p>
          <div className="mt-5 space-y-2 text-body-sm text-slate-100/90">
            <div className="flex items-center justify-between">
              <span>{t('admin.dashboard.gates.totalPasses', 'Total passes')}</span>
              <span>{numberFormatter.format(snapshot.gates.totalPasses)}</span>
            </div>
            {snapshot.gates.breakdown.map((gate) => (
              <div key={gate.gate} className="flex items-center justify-between text-caption text-slate-300/90">
                <span>{gate.gate}</span>
                <span>{numberFormatter.format(gate.passes)}</span>
              </div>
            ))}
            {!snapshot.gates.breakdown.length && (
              <div className="text-caption text-slate-400/80">
                {t('admin.dashboard.gates.empty', 'No gate activity recorded.')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-md text-slate-100">
            {t('admin.dashboard.alerts.title', 'Operational Alerts')}
          </h2>
          <span className="text-caption text-slate-400/80">
            {t('admin.dashboard.alerts.refreshedAt', 'Refreshed')} {new Date(snapshot.generatedAt).toLocaleString()}
          </span>
        </div>
        {snapshot.alerts.length ? (
          <ul className="mt-4 space-y-2">
            {snapshot.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-xl border p-3 text-body-sm ${
                  alert.severity === 'critical'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-100'
                    : alert.severity === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                    : 'border-slate-500/40 bg-slate-500/10 text-slate-100'
                }`}
              >
                <div className="type-caption opacity-80">{alert.severity}</div>
                <div className="mt-2 text-body text-pretty">{alert.message}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-prose text-body-sm text-slate-300/90">
            {t('admin.dashboard.alerts.empty', 'All systems nominal. No alerts triggered in the last refresh.')}
          </p>
        )}
      </section>
    </div>
  );
};

export default AdminDashboardClient;
