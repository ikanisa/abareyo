'use client';

import Link from 'next/link';
import { useMemo, useState, type ComponentType } from 'react';

import { AdminStatCard } from '@/components/admin/ui';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import type { DashboardSnapshot } from '@/services/admin/dashboard';
import { AdminBottomSheet } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import type { DashboardSnapshot } from '@/services/admin/dashboard';
import { AdminSection } from '@/components/admin/layout/AdminSection';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import type { DashboardSnapshot } from '@/services/admin/dashboard';
import { cn } from '@/lib/utils';

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

type AlertModalState = {
  title: string;
  description: string;
  message: string;
  helper?: string;
  href?: string;
  ctaLabel?: string;
};

export const AdminDashboardClient = ({ snapshot }: AdminDashboardClientProps) => {
  const { t } = useAdminLocale();
  const [activeAlertAction, setActiveAlertAction] = useState<AlertModalState | null>(null);
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
          <AdminStatCard
            key={card.key}
            title={card.label}
            value={formatValue(card.value7d, card.format)}
            valueLabel={t('admin.dashboard.kpi.range.sevenDay', 'Last 7 days')}
            stats={[
              {
                label: t('admin.dashboard.kpi.range.thirtyDay', '30d'),
                value: formatValue(card.value30d, card.format),
              },
            ]}
            trend={
              card.trendLabel
                ? {
                    label: card.trendLabel,
                    tone: card.isPositive ? 'positive' : card.isNegative ? 'negative' : 'neutral',
                  }
                : undefined
            }
          />
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
        <AdminStatCard
          title={t('admin.dashboard.sms.title', 'SMS Parser Health')}
          description={
            snapshot.sms.successRate === null
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
                )
          }
          variant="muted"
        >
          <div className="mt-2 space-y-2 text-sm text-slate-300">
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
    <div className="flex flex-col gap-[var(--space-6)]">
      <AdminSection variant="plain" padded={false} className="gap-0">
        <div className="grid gap-[var(--space-4)] md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-[var(--space-5)] shadow-lg shadow-primary/5"
            >
              <div className="text-xs uppercase tracking-wide text-slate-400">{card.label}</div>
              <div className="mt-[var(--space-2)] text-2xl font-semibold text-slate-100">
                {formatValue(card.value7d, card.format)}
              </div>
              <div className="mt-[var(--space-2)] flex items-center justify-between text-xs text-slate-500">
                <span>{t('admin.dashboard.kpi.range.sevenDay', 'Last 7 days')}</span>
                <span>
                  {t('admin.dashboard.kpi.range.thirtyDay', '30d')}
                  : {formatValue(card.value30d, card.format)}
                </span>
              </div>
              {card.trendLabel && (
                <div
                  className={cn(
                    'mt-[var(--space-2)] text-xs font-medium',
                    card.isPositive
                      ? 'text-emerald-400'
                      : card.isNegative
                        ? 'text-rose-400'
                        : 'text-slate-400',
                  )}
                >
                  {card.trendLabel}
                </div>
              )}
            </div>
          </div>
        </AdminStatCard>

        <AdminStatCard
          title={t('admin.dashboard.payments.title', 'Payment SLA')}
          description={t(
            'admin.dashboard.payments.subtitle',
            'Tracking reconciliation speed across ticket and shop payments.',
          )}
          variant="muted"
        >
          <div className="mt-2 space-y-2 text-sm text-slate-300">
          ))}
        </div>
      </AdminSection>

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
      <AdminSection variant="plain" padded={false} className="gap-0">
        <div className="grid gap-[var(--space-4)] lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-[var(--space-6)]">
            <h2 className="text-lg font-semibold text-slate-100">
              {t('admin.dashboard.sms.title', 'SMS Parser Health')}
            </h2>
            <p className="mt-[var(--space-2)] text-sm text-slate-400">
              {snapshot.sms.successRate === null
                ? t('admin.dashboard.sms.empty', 'No inbound SMS records in the last 7 days.')
                : t(
                    'admin.dashboard.sms.summary',
                    `Success rate ${(snapshot.sms.successRate * 100).toFixed(1)}% across ${numberFormatter.format(
                      snapshot.sms.rawCount7d,
                    )} messages.`,
                  )}
            </p>
            <div className="mt-[var(--space-4)] space-y-[var(--space-2)] text-sm text-slate-300">
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
        </AdminStatCard>

        <AdminStatCard
          title={t('admin.dashboard.gates.title', 'Gate Throughput')}
          description={t(
            'admin.dashboard.gates.subtitle',
            `Pass issuance activity over the last ${snapshot.gates.windowHours}-hour window.`,
          )}
          variant="muted"
        >
          <div className="mt-2 space-y-2 text-sm text-slate-300">

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
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-[var(--space-6)]">
            <h2 className="text-lg font-semibold text-slate-100">
              {t('admin.dashboard.payments.title', 'Payment SLA')}
            </h2>
            <p className="mt-[var(--space-2)] text-sm text-slate-400">
              {t('admin.dashboard.payments.subtitle', 'Tracking reconciliation speed across ticket and shop payments.')}
            </p>
            <div className="mt-[var(--space-4)] space-y-[var(--space-2)] text-sm text-slate-300">
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-[var(--space-6)]">
            <h2 className="text-lg font-semibold text-slate-100">
              {t('admin.dashboard.gates.title', 'Gate Throughput')}
            </h2>
            <p className="mt-[var(--space-2)] text-sm text-slate-400">
              {t(
                'admin.dashboard.gates.subtitle',
                `Pass issuance activity over the last ${snapshot.gates.windowHours}-hour window.`,
              )}
            </p>
            <div className="mt-[var(--space-4)] space-y-[var(--space-2)] text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>{t('admin.dashboard.gates.totalPasses', 'Total passes')}</span>
                <span>{numberFormatter.format(snapshot.gates.totalPasses)}</span>
              </div>
              {snapshot.gates.breakdown.map((gate) => (
                <div key={gate.gate} className="flex items-center justify-between text-xs text-slate-400">
                  <span>{gate.gate}</span>
                  <span>{numberFormatter.format(gate.passes)}</span>
                </div>
              ))}
              {!snapshot.gates.breakdown.length && (
                <div className="text-xs text-slate-500">
                  {t('admin.dashboard.gates.empty', 'No gate activity recorded.')}
                </div>
              )}
            </div>
          </div>
        </AdminStatCard>
      </section>

      <AdminStatCard
        title={t('admin.dashboard.alerts.title', 'Operational Alerts')}
        description={
          snapshot.alerts.length
            ? t('admin.dashboard.alerts.summary', 'Live checks across ingestion and reconciliation pipelines.')
            : t('admin.dashboard.alerts.empty', 'All systems nominal. No alerts triggered in the last refresh.')
        }
        variant="muted"
        footer={`${t('admin.dashboard.alerts.refreshedAt', 'Refreshed')} ${new Date(snapshot.generatedAt).toLocaleString()}`}
      >
        {snapshot.alerts.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {snapshot.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-xl border p-3 ${
        </div>
      </AdminSection>

      <AdminSection as="section">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-md text-slate-100">
            {t('admin.dashboard.alerts.title', 'Operational Alerts')}
          </h2>
          <span className="text-caption text-slate-400/80">
            {t('admin.dashboard.alerts.refreshedAt', 'Refreshed')} {new Date(snapshot.generatedAt).toLocaleString()}
          </span>
        </div>
        {snapshot.alerts.length ? (
          <ul className="mt-[var(--space-4)] space-y-[var(--space-2)]">
            {snapshot.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-xl border p-3 text-body-sm ${
                className={cn(
                  'rounded-xl border p-[var(--space-3)] text-sm',
                  alert.severity === 'critical'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-100'
                    : alert.severity === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                      : 'border-slate-500/40 bg-slate-500/10 text-slate-100',
                )}
              >
                <div className="type-caption opacity-80">{alert.severity}</div>
                <div className="mt-2 text-body text-pretty">{alert.message}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">{alert.severity}</div>
                <div className="mt-1 font-medium">{alert.message}</div>
                {alert.action ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {alert.action.type === 'link' ? (
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={alert.action.href}>{alert.action.label}</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setActiveAlertAction({
                            title: alert.action.title,
                            description: alert.action.description,
                            helper: alert.action.helper,
                            href: alert.action.href,
                            ctaLabel: alert.action.ctaLabel,
                            message: alert.message,
                          })
                        }
                      >
                        {alert.action.label}
                      </Button>
                    )}
                  </div>
                ) : null}
                <div className="mt-[var(--space-1)] font-medium">{alert.message}</div>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminStatCard>
        ) : (
          <p className="mt-4 max-w-prose text-body-sm text-slate-300/90">
          <p className="mt-[var(--space-4)] text-sm text-slate-400">
            {t('admin.dashboard.alerts.empty', 'All systems nominal. No alerts triggered in the last refresh.')}
          </p>
        )}
      </section>

      <AdminBottomSheet
        title={activeAlertAction?.title ?? ''}
        open={Boolean(activeAlertAction)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAlertAction(null);
          }
        }}
      >
        {activeAlertAction ? (
          <div className="space-y-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-400">Alert</p>
            <p className="text-sm font-medium text-slate-100">{activeAlertAction.message}</p>
            <p className="leading-relaxed text-slate-200">{activeAlertAction.description}</p>
            {activeAlertAction.helper ? (
              <p className="text-xs text-slate-400">{activeAlertAction.helper}</p>
            ) : null}
            {activeAlertAction.href ? (
              <Button variant="default" size="sm" asChild>
                <Link href={activeAlertAction.href}>
                  {activeAlertAction.ctaLabel ?? t('admin.dashboard.alerts.openLink', 'Open link')}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </AdminBottomSheet>
      </AdminSection>
    </div>
  );
};

export default AdminDashboardClient;
