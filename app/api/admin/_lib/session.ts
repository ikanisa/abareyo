import { createHash, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import type { Tables } from '@/integrations/supabase/types';

import { getServiceClient } from './db';

const ADMIN_COOKIE_NAME = process.env.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? 'admin_session';
const DEFAULT_SESSION_TTL_HOURS = 12;

const parseCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey || rest.length === 0) continue;
    if (rawKey === ADMIN_COOKIE_NAME) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export type AdminContext = {
  user: {
    id: string;
    email: string;
    displayName: string;
    status: string;
    roles: string[];
  };
  permissions: string[];
  session: { id: string; expiresAt: string | null };
};

export type RequireAdminResult =
  | { context: AdminContext; response?: undefined }
  | { context?: undefined; response: NextResponse };

type RoleLink = { role_id: string; admin_roles?: { name: string } | null };

const normalizeRoles = (roleLinks: RoleLink[]) => {
  const names = new Set<string>();
  for (const link of roleLinks) {
    const name = link.admin_roles?.name;
    if (name) names.add(name);
  }
  return Array.from(names);
};

type PermissionLink = { permissions?: { key: string } | null };

const normalizePermissions = (permissionLinks: PermissionLink[]) => {
  const keys = new Set<string>();
  for (const entry of permissionLinks) {
    const key = entry.permissions?.key;
    if (key) keys.add(key);
  }
  return Array.from(keys);
};

export const fetchAdminContextForToken = async (
  token: string,
): Promise<AdminContext | null> => {
  const client = getServiceClient();
  const hashed = hashToken(token);

  const { data: session, error: sessionError } = await client
    .from('admin_sessions')
    .select('id, admin_user_id, expires_at, revoked')
    .eq('token_hash', hashed)
    .maybeSingle();

  if (sessionError || !session || session.revoked) {
    return null;
  }

  if (session.expires_at && new Date(session.expires_at) <= new Date()) {
    return null;
  }

  const { data: user, error: userError } = await client
    .from('admin_users')
    .select('id, email, display_name, status')
    .eq('id', session.admin_user_id)
    .maybeSingle();

  if (userError || !user || user.status !== 'active') {
    return null;
  }

  const { data: roleLinks } = await client
    .from('admin_users_roles')
    .select('role_id, admin_roles(name)')
    .eq('admin_user_id', user.id);

  const roles = normalizeRoles(roleLinks ?? []);
  const roleIds = (roleLinks ?? []).map((link) => link.role_id);

  let permissions: string[] = [];
  if (roleIds.length) {
    const { data: permLinks } = await client
      .from('roles_permissions')
      .select('permissions(key)')
      .in('role_id', roleIds);
    permissions = normalizePermissions(permLinks ?? []);
  }

  await client
    .from('admin_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', session.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name ?? user.email,
      status: user.status,
      roles,
    },
    permissions,
    session: { id: session.id, expiresAt: session.expires_at ?? null },
  };
};

export const requireAdmin = async (
  req: Request,
  options?: { permission?: string },
): Promise<RequireAdminResult> => {
  const token = parseCookie(req.headers.get('cookie'));
  if (!token) {
    return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const context = await fetchAdminContextForToken(token);
    if (!context) {
      return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
    }

    if (options?.permission) {
      const allowed =
        context.permissions.includes(options.permission) || context.permissions.includes('*');
      if (!allowed) {
        return { response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
      }
    }

    return { context };
  } catch (error) {
    console.error('admin session validation failed', error);
    return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
};

export const createAdminSession = async (
  adminUserId: string,
  ttlHours = DEFAULT_SESSION_TTL_HOURS,
): Promise<{ token: string; session: Pick<Tables<'admin_sessions'>, 'id' | 'expires_at'> }> => {
  const client = getServiceClient();
  const token = randomUUID();
  const hashed = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('admin_sessions')
    .insert({ admin_user_id: adminUserId, token_hash: hashed, expires_at: expiresAt })
    .select('id, expires_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create admin session');
  }

  return { token, session: data };
};

export const destroyAdminSession = async (token: string) => {
  const client = getServiceClient();
  const hashed = hashToken(token);
  await client.from('admin_sessions').update({ revoked: true }).eq('token_hash', hashed);
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return response;
};

export const withSessionCookie = (
  response: NextResponse,
  token: string,
  expiresAt: string | null,
) => {
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
  return response;
};
