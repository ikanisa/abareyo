import { NextRequest } from 'next/server';

import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.admin']);
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '100', 10) || 100, 200);
    const adminUserId = searchParams.get('adminUserId') ?? searchParams.get('admin_user_id') ?? undefined;
    const actionFilter = searchParams.get('action') ?? undefined;
    const entityTypeFilter = searchParams.get('entityType') ?? searchParams.get('entity_type') ?? undefined;
    const search = searchParams.get('search') ?? searchParams.get('q') ?? undefined;
    const since = searchParams.get('since') ?? undefined;

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch (error) {
      adminLogger.warn('admin.audit.supabase_unconfigured', {
        admin: session.user.id,
        message: error instanceof Error ? error.message : String(error),
      });
      return respond({
        logs: [],
        meta: { configured: false },
      });
    }

    let query = supabase
      .from('audit_logs')
      .select(
        `id, action, entity_type, entity_id, before, after, context, at, ip, ua, admin_user_id, admin:admin_users(id, display_name, email)`,
      )
      .order('at', { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gte('at', since);
    }

    if (adminUserId) {
      query = query.eq('admin_user_id', adminUserId);
    }

    if (actionFilter) {
      query = query.ilike('action', `%${actionFilter}%`);
    }

    if (entityTypeFilter) {
      query = query.ilike('entity_type', `%${entityTypeFilter}%`);
    }

    if (search) {
      const sanitized = search.replace(/'/g, "''");
      query = query.or(`entity_id.ilike.%${sanitized}%,action.ilike.%${sanitized}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    adminLogger.info('admin.audit.list', { admin: session.user.id, count: data?.length ?? 0 });
    return respond({ logs: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('admin.audit.list_failed', { error: (error as Error).message });
    return respondWithError('audit_fetch_failed', 'Unable to load audit logs', 500);
  }
}
