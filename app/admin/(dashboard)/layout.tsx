import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import AdminOfflineNotice from '@/components/admin/AdminOfflineNotice';
import { AdminSessionProvider } from '@/providers/admin-session-provider';
import { fetchAdminFeatureFlagsSnapshot } from '@/services/admin/feature-flags';
import { listAllPermissions, type AdminPermission } from '@/config/admin-rbac';
import {
  reportAdminAvailabilityException,
  reportAdminAvailabilityIssue,
} from '@/lib/observability/admin';
import { buildAdminRouteMetadata } from '@admin/_lib/metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = buildAdminRouteMetadata('/admin', {
  title: 'Admin operations dashboard',
  description: 'Access moderation, ticketing, membership, and real-time analytics for Rayon Sports.',
});

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const ADMIN_COOKIE_NAME = process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session';
const ENV_LABEL = process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? process.env.NODE_ENV ?? 'dev';

type AdminUserResponse = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
};

type AdminMeResponse = {
  data?: {
    user?: AdminUserResponse | null;
    permissions?: string[];
    session?: { id: string; expiresAt: string | null } | null;
  };
};

const FALLBACK_BACKEND = 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 4000;
const MAX_FETCH_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 400;
const KNOWN_ADMIN_PERMISSIONS = new Set<string>(listAllPermissions());
const isKnownAdminPermission = (permission: string): permission is AdminPermission =>
  KNOWN_ADMIN_PERMISSIONS.has(permission);

type AdminUnavailableReason =
  | 'rate-limited'
  | 'maintenance'
  | 'bad-gateway'
  | 'http-error'
  | 'network-error';

type AdminContextResult =
  | { status: 'ok'; value: { user: AdminUserResponse; permissions: string[] } }
  | { status: 'unauthorised' }
  | {
      status: 'unavailable';
      reason: AdminUnavailableReason;
      message: string;
      statusCode?: number;
      retryAfterSeconds?: number | null;
    };

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

async function fetchAdminContext(cookieHeader: string): Promise<AdminContextResult> {
  if (!BACKEND_BASE) {
    reportAdminAvailabilityIssue('admin_backend_url_missing');
    return {
      status: 'unavailable',
      reason: 'network-error',
      message: 'NEXT_PUBLIC_BACKEND_URL is not configured. Configure it to enable the admin dashboard.',
    };
  }

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${BACKEND_BASE || FALLBACK_BACKEND}/admin/me`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
          ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
          : undefined,
      });

      if (response.status === 401 || response.status === 403) {
        return { status: 'unauthorised' };
      }

      if (!response.ok) {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) || null : null;
        const reason: AdminUnavailableReason = response.status === 429
          ? 'rate-limited'
          : response.status === 503
            ? 'maintenance'
            : response.status === 502 || response.status === 504
              ? 'bad-gateway'
              : 'http-error';

        reportAdminAvailabilityIssue('admin_session_endpoint_failure', {
          backendBase: BACKEND_BASE,
          status: response.status,
          attempt,
          reason,
        });

        if (attempt < MAX_FETCH_ATTEMPTS && reason === 'http-error') {
          const backoffDelay = BACKOFF_BASE_MS * 2 ** (attempt - 1);
          await sleep(backoffDelay);
          continue;
        }

        return {
          status: 'unavailable',
          reason,
          statusCode: response.status,
          retryAfterSeconds,
          message:
            reason === 'rate-limited'
              ? 'Too many admin requests in a short period. Please pause before retrying.'
              : reason === 'maintenance'
                ? 'The admin API is undergoing maintenance. Try again shortly.'
                : reason === 'bad-gateway'
                  ? 'Upstream services are unavailable. Investigate the API gateway or backend pods.'
                  : `Admin session endpoint responded with ${response.status}.`,
        };
      }

      const payload = (await response.json()) as AdminMeResponse;
      const user = payload.data?.user ?? null;
      if (!user) {
        return { status: 'unauthorised' };
      }

      const rawPermissions = payload.data?.permissions ?? [];
      const normalizedPermissions = rawPermissions.filter(isKnownAdminPermission);

      if (rawPermissions.length !== normalizedPermissions.length) {
        const unknown = rawPermissions.filter((permission) => !KNOWN_ADMIN_PERMISSIONS.has(permission));
        console.warn('admin-dashboard: unknown permissions filtered', { unknown });
        reportAdminAvailabilityIssue('admin_unknown_permissions_filtered', { unknown });
      }

      return {
        status: 'ok',
        value: {
          user,
          permissions: normalizedPermissions,
        },
      };
    } catch (error) {
      console.error('Failed to fetch admin session context', error);
      reportAdminAvailabilityException(error, { backendBase: BACKEND_BASE, attempt });

      if (attempt < MAX_FETCH_ATTEMPTS) {
        const backoffDelay = BACKOFF_BASE_MS * 2 ** (attempt - 1);
        await sleep(backoffDelay);
        continue;
      }

      return {
        status: 'unavailable',
        reason: 'network-error',
        message: 'Unable to reach admin session endpoint. Confirm backend is running and accessible.',
      };
    }
  }

  return {
    status: 'unavailable',
    reason: 'network-error',
    message: 'Admin context fetch retries exhausted. Verify connectivity and backend health.',
  };
}

type AdminOfflineNoticeProps = {
  message: string;
  reason: AdminUnavailableReason;
  retryAfterSeconds?: number | null;
};

const offlineCopyByReason: Record<AdminUnavailableReason, { title: string; helper: string }> = {
  'network-error': {
    title: 'Cannot reach admin API',
    helper: 'Check VPN, backend pods, and reverse proxy routes before retrying.',
  },
  'http-error': {
    title: 'Admin API returned an error',
    helper: 'Inspect API logs for the failing request and redeploy if required.',
  },
  'bad-gateway': {
    title: 'Upstream gateway error',
    helper: 'Verify ingress, service mesh, or load balancer health. Restart pods if needed.',
  },
  'maintenance': {
    title: 'Planned maintenance in progress',
    helper: 'Ops is rolling out updates. Access will resume once the deployment completes.',
  },
  'rate-limited': {
    title: 'Too many admin requests',
    helper: 'Slow down API calls or investigate automation loops triggering the endpoint.',
  },
};

const formatRetryAfter = (retryAfterSeconds?: number | null) => {
  if (!retryAfterSeconds || Number.isNaN(retryAfterSeconds)) {
    return null;
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes <= 1) {
    return 'Try again in about a minute.';
  }
  return `Try again in approximately ${minutes} minutes.`;
};

const AdminDashboardLayout = async ({ children }: { children: ReactNode }) => {
  if (!BACKEND_BASE) {
    return (
      <AdminOfflineNotice
        message="The backend URL is not configured for this environment."
        reason="network-error"
      />
    );
  }

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!sessionCookie) {
    redirect('/admin/login');
  }

  const cookieHeader = cookieStore.toString();
  const context = await fetchAdminContext(cookieHeader);

  if (context.status === 'unauthorised') {
    redirect('/admin/login');
  }

  if (context.status === 'unavailable') {
    reportAdminAvailabilityIssue('admin_dashboard_unavailable_state', {
      message: context.message,
      reason: context.reason,
      statusCode: context.statusCode,
    });
    return (
      <AdminOfflineNotice
        message={context.message}
        reason={context.reason}
        retryAfterSeconds={context.retryAfterSeconds}
      />
    );
  }

  const featureFlags = await fetchAdminFeatureFlagsSnapshot();

  return (
    <AdminSessionProvider value={{ user: context.value.user, permissions: context.value.permissions }}>
      <AdminShell user={context.value.user} environment={ENV_LABEL} featureFlags={featureFlags}>
        {children}
      </AdminShell>
    </AdminSessionProvider>
  );
};

export default AdminDashboardLayout;
