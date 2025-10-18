import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.admin']);
    const supabase = getSupabaseAdmin();
    const [usersResponse, rolesResponse, permsResponse] = await Promise.all([
      supabase.from('admin_users').select('id, email, display_name, status, last_login'),
      supabase.from('admin_roles').select('id, name, description'),
      supabase.from('admin_permissions').select('id, code, description'),
    ]);

    if (usersResponse.error) throw usersResponse.error;
    if (rolesResponse.error) throw rolesResponse.error;
    if (permsResponse.error) throw permsResponse.error;

    adminLogger.info('admin.rbac.list', { admin: session.user.id });
    return respond({
      users: usersResponse.data ?? [],
      roles: rolesResponse.data ?? [],
      permissions: permsResponse.data ?? [],
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('admin.rbac.list_failed', { error: (error as Error).message });
    return respondWithError('admin_rbac_failed', 'Unable to load RBAC', 500);
  }
}

type AssignPayload = {
  admin_user_id: string;
  role_id: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.admin']);
    const payload = (await request.json()) as AssignPayload;

    if (!payload?.admin_user_id || !payload.role_id) {
      return respondWithError('rbac_payload_invalid', 'Admin user id and role id required', 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('admin_user_roles')
      .upsert({ admin_user_id: payload.admin_user_id, role_id: payload.role_id })
      .select('admin_user_id, role_id, assigned_at')
      .single();

    if (error) throw error;

    await recordAudit(supabase, {
      action: 'admin.role.assign',
      entityType: 'admin_user_role',
      entityId: `${payload.admin_user_id}:${payload.role_id}`,
      before: null,
      after: data,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    adminLogger.info('admin.rbac.assigned', { admin: session.user.id, target: payload.admin_user_id, role: payload.role_id });
    return respond({ assignment: data }, 201);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('admin.rbac.assign_failed', { error: (error as Error).message });
    return respondWithError('admin_role_assign_failed', 'Unable to assign role', 500);
  }
}
