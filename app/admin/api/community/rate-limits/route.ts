import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.community']);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('admin_community_rate_limits')
      .select('*')
      .order('rate_limited', { ascending: false })
      .order('posts_15m', { ascending: false });

    if (error) throw error;

    adminLogger.info('community.rate_limits.snapshot', {
      admin: session.user.id,
      count: data?.length ?? 0,
    });

    return respond({ rateLimits: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('community.rate_limits.failed', { error: (error as Error).message });
    return respondWithError('community_rate_limits_failed', 'Unable to load rate limit telemetry', 500);
  }
}
