import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.users']);
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    return await withAdminServiceClient(async (supabase) => {
      let builder = supabase
        .from('users')
        .select('id, display_name, phone, public_profile, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (query) {
        const sanitized = query.replace(/'/g, "''");
        builder = builder.or(`display_name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
      }

      const { data, error } = await builder;
      if (error) throw error;

      adminLogger.info('users.directory.list', { admin: session.user.id, count: data?.length ?? 0 });
      return respond({ users: data ?? [] });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('users.directory.list_failed', { error: (error as Error).message });
    return respondWithError('users_fetch_failed', 'Unable to load users', 500);
  }
}

type MergePayload = {
  primary_user_id: string;
  secondary_user_id: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.users']);
    const payload = (await request.json()) as MergePayload;

    if (!payload?.primary_user_id || !payload.secondary_user_id) {
      return respondWithError('merge_ids_required', 'Both user ids are required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const { data: secondary, error } = await supabase
        .from('users')
        .select('id, public_profile')
        .eq('id', payload.secondary_user_id)
        .maybeSingle();

      if (error) throw error;
      if (!secondary) {
        return respondWithError('secondary_not_found', 'Secondary user not found', 404);
      }

      await supabase
        .from('users')
        .delete()
        .eq('id', payload.secondary_user_id);

      await recordAudit(supabase, {
        action: 'users.merge',
        entityType: 'user',
        entityId: payload.primary_user_id,
        before: { secondary },
        after: { merged: payload.secondary_user_id },
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('users.directory.merged', {
        admin: session.user.id,
        primary: payload.primary_user_id,
        secondary: payload.secondary_user_id,
      });
      return respond({ status: 'ok' }, 201);
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('users.directory.merge_failed', { error: (error as Error).message });
    return respondWithError('user_merge_failed', 'Unable to merge users', 500);
  }
}
