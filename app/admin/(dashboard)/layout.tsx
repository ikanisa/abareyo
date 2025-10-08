import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSessionProvider } from '@/providers/admin-session-provider';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';
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

async function fetchAdminContext(cookieHeader: string) {
  const response = await fetch(`${BACKEND_BASE}/admin/me`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Unable to load admin session context.');
  }

  const payload = (await response.json()) as AdminMeResponse;

  return {
    user: payload.data?.user ?? null,
    permissions: payload.data?.permissions ?? [],
    session: payload.data?.session ?? null,
  };
}

const AdminDashboardLayout = async ({ children }: { children: ReactNode }) => {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!sessionCookie) {
    redirect('/admin/login');
  }

  const cookieHeader = cookieStore.toString();
  const context = await fetchAdminContext(cookieHeader);

  if (!context || !context.user) {
    redirect('/admin/login');
  }

  return (
    <AdminSessionProvider value={{ user: context.user, permissions: context.permissions }}>
      <AdminShell user={context.user} environment={ENV_LABEL}>
        {children}
      </AdminShell>
    </AdminSessionProvider>
  );
};

export default AdminDashboardLayout;
