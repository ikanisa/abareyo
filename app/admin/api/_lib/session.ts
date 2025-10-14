import { cookies, headers } from 'next/headers';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const ADMIN_COOKIE_NAME = process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session';

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
};

type AdminSessionPayload = {
  data?: {
    user?: AdminUser | null;
    permissions?: string[];
  };
};

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminAuthError';
    this.status = status;
  }
}

export type AdminSessionContext = {
  user: AdminUser;
  permissions: string[];
  cookieHeader: string;
  ip?: string | null;
  userAgent?: string | null;
};

export async function requireAdminSession(requiredPermissions: string[] = []): Promise<AdminSessionContext> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!sessionCookie) {
    throw new AdminAuthError('admin_unauthenticated', 401);
  }

  const cookieHeader = cookieStore.toString();
  const response = await fetch(`${BACKEND_BASE}/admin/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    throw new AdminAuthError('admin_forbidden', response.status);
  }

  if (!response.ok) {
    throw new Error('Failed to resolve admin session context');
  }

  const payload = (await response.json()) as AdminSessionPayload;
  const user = payload.data?.user;
  const permissions = payload.data?.permissions ?? [];

  if (!user) {
    throw new AdminAuthError('admin_session_invalid', 401);
  }

  const missing = requiredPermissions.filter((permission) => !permissions.includes(permission));
  if (missing.length > 0) {
    throw new AdminAuthError('admin_permission_denied', 403);
  }

  const headerList = headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headerList.get('x-real-ip');
  const userAgent = headerList.get('user-agent');

  return { user, permissions, cookieHeader, ip, userAgent };
}
