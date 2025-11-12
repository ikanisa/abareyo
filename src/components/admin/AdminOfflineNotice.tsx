"use client";

import { useEffect, useMemo, useRef } from "react";

import { AdminLocaleProvider, useAdminLocale } from '@/providers/admin-locale-provider';

export type AdminOfflineNoticeProps = {
  message: string;
  reason?: 'rate-limited' | 'maintenance' | 'bad-gateway' | 'http-error' | 'network-error';
  retryAfterSeconds?: number | null;
};

const AdminOfflineNoticeContent = ({ message, reason = 'network-error', retryAfterSeconds }: AdminOfflineNoticeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useAdminLocale();

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const heading = t('admin.offline.heading', 'Admin dashboard unavailable');
  const reasonCopy = useMemo(
    () => ({
      'network-error': {
        title: t('admin.offline.reason.networkError.title', 'Cannot reach the admin API'),
        helper: t(
          'admin.offline.reason.networkError.helper',
          'Confirm VPN access, backend pods, and reverse proxy routes before retrying.',
        ),
      },
      'http-error': {
        title: t('admin.offline.reason.httpError.title', 'The admin API returned an error'),
        helper: t(
          'admin.offline.reason.httpError.helper',
          'Inspect API logs for the failing request and redeploy if required.',
        ),
      },
      'bad-gateway': {
        title: t('admin.offline.reason.badGateway.title', 'Upstream gateway is unavailable'),
        helper: t(
          'admin.offline.reason.badGateway.helper',
          'Verify ingress, service mesh, or load balancer health and restart pods if needed.',
        ),
      },
      maintenance: {
        title: t('admin.offline.reason.maintenance.title', 'Maintenance window in progress'),
        helper: t(
          'admin.offline.reason.maintenance.helper',
          'Ops is rolling out updates. Access resumes once the deployment completes.',
        ),
      },
      'rate-limited': {
        title: t('admin.offline.reason.rateLimited.title', 'Too many admin requests detected'),
        helper: t(
          'admin.offline.reason.rateLimited.helper',
          'Pause automation or reduce API calls before trying again.',
        ),
      },
    }),
    [t],
  );

  const { title, helper } = reasonCopy[reason] ?? reasonCopy['network-error'];

  const retryHint = useMemo(() => {
    if (!retryAfterSeconds || Number.isNaN(retryAfterSeconds)) {
      return null;
    }
    const minutes = Math.ceil(retryAfterSeconds / 60);
    if (minutes <= 1) {
      return t('admin.offline.retry.soon', 'Try again in about a minute.');
    }
    return t('admin.offline.retry.minutes', `Try again in approximately ${minutes} minutes.`);
  }, [retryAfterSeconds, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-200">
      <div
        ref={containerRef}
        className="max-w-md space-y-4 text-center outline-none"
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
      >
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm text-slate-300">{title}</p>
        <p className="text-sm text-slate-400">{message}</p>
        {retryHint ? <p className="text-xs text-slate-400">{retryHint}</p> : null}
        <p className="text-xs text-slate-500">{helper}</p>
        <p className="text-xs text-slate-500">
          {t('admin.offline.support.prompt', 'Need help?')}{' '}
          <a className="text-primary underline" href="mailto:ops@gikundiro.com">
            {t('admin.offline.support.email', 'Email the ops desk')}
          </a>{' '}
          {t('admin.offline.support.status', 'or review the internal status page.')}
        </p>
        <p className="text-xs text-slate-500">
          {t(
            'admin.offline.configHint',
            'Confirm NEXT_PUBLIC_BACKEND_URL and that the admin API responds before retrying.',
          )}
        </p>
      </div>
    </div>
  );
};

export const AdminOfflineNotice = (props: AdminOfflineNoticeProps) => (
  <AdminLocaleProvider>
    <AdminOfflineNoticeContent {...props} />
  </AdminLocaleProvider>
);

export default AdminOfflineNotice;
