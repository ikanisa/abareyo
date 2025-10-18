import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.rewards']);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled, description, context, updated_at')
      .ilike('key', 'rewards.rule.%')
      .order('key', { ascending: true });

    if (error) throw error;

    adminLogger.info('rewards.rules.list', { admin: session.user.id, count: data?.length ?? 0 });
    return respond({ rules: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('rewards.rules.list_failed', { error: (error as Error).message });
    return respondWithError('rewards_rules_failed', 'Unable to load rewards rules', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.rewards']);
    const payload = (await request.json()) as { key: string; enabled: boolean; description?: string; context?: unknown };

    if (!payload?.key) {
      return respondWithError('rule_key_required', 'Key is required', 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('feature_flags')
      .upsert(
        {
          key: payload.key,
          enabled: payload.enabled,
          description: payload.description ?? null,
          context: payload.context ?? {},
          updated_by: session.user.id,
        },
        { onConflict: 'key' },
      )
      .select('key, enabled, description, context, updated_at')
      .single();

    if (error) throw error;

    await recordAudit(supabase, {
      action: 'rewards.rule.upsert',
      entityType: 'feature_flag',
      entityId: payload.key,
      before: null,
      after: data,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    adminLogger.info('rewards.rules.updated', { admin: session.user.id, rule: payload.key, enabled: payload.enabled });
    return respond({ rule: data }, 201);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('rewards.rules.update_failed', { error: (error as Error).message });
    return respondWithError('rewards_rule_update_failed', 'Unable to update rewards rule', 500);
  }
}
