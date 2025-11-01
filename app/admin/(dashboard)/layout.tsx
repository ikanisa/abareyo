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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
const KNOWN_ADMIN_PERMISSIONS = new Set<string>(listAllPermissions());
const isKnownAdminPermission = (permission: string): permission is AdminPermission =>
  KNOWN_ADMIN_PERMISSIONS.has(permission);

type AdminContextResult =
  | { status: 'ok'; value: { user: AdminUserResponse; permissions: string[] } }
  | { status: 'unauthorised' }
  | { status: 'unavailable'; message: string };

async function fetchAdminContext(cookieHeader: string): Promise<AdminContextResult> {
  if (!BACKEND_BASE) {
    reportAdminAvailabilityIssue('admin_backend_url_missing');
    return {
      status: 'unavailable',
      message: 'NEXT_PUBLIC_BACKEND_URL is not configured. Configure it to enable the admin dashboard.',
    };
  }

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
      reportAdminAvailabilityIssue('admin_session_endpoint_failure', {
        backendBase: BACKEND_BASE,
        status: response.status,
      });
      return {
        status: 'unavailable',
        message: `Admin session endpoint responded with ${response.status}.`,
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
    reportAdminAvailabilityException(error, { backendBase: BACKEND_BASE });
    return {
      status: 'unavailable',
      message: 'Unable to reach admin session endpoint. Confirm backend is running and accessible.',
    };
  }
}

const AdminDashboardLayout = async ({ children }: { children: ReactNode }) => {
  if (!BACKEND_BASE) {
    return (
      <AdminOfflineNotice message="The backend URL is not configured for this environment." />
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
    });
    return <AdminOfflineNotice message={context.message} />;
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
