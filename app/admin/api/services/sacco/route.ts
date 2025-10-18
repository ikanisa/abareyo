import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

type SaccoUpdatePayload = {
  id: string;
  status: 'pending' | 'confirmed';
  ref?: string | null;
};

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.services']);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sacco_deposits')
      .select('id, user_id, amount, status, ref, referral_code, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    adminLogger.info('services.sacco.list', { admin: session.user.id, count: data?.length ?? 0 });
    return respond({ deposits: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('services.sacco.list_failed', { error: (error as Error).message });
    return respondWithError('sacco_fetch_failed', 'Unable to load SACCO deposits', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.services']);
    const payload = (await request.json()) as SaccoUpdatePayload;
    if (!payload?.id) {
      return respondWithError('deposit_id_required', 'Deposit id required', 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: before, error: beforeError } = await supabase
      .from('sacco_deposits')
      .select('id, status, ref, amount, user_id')
      .eq('id', payload.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) {
      return respondWithError('deposit_not_found', 'Deposit not found', 404);
    }

    const { data: updated, error } = await supabase
      .from('sacco_deposits')
      .update({ status: payload.status, ref: payload.ref ?? before.ref })
      .eq('id', payload.id)
      .select('id, status, ref, amount, user_id, updated_at')
      .single();

    if (error) throw error;

    await recordAudit(supabase, {
      action: 'sacco.deposit.update',
      entityType: 'sacco_deposit',
      entityId: payload.id,
      before,
      after: updated,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    adminLogger.info('services.sacco.updated', { admin: session.user.id, deposit: payload.id, status: payload.status });
    return respond({ deposit: updated });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('services.sacco.update_failed', { error: (error as Error).message });
    return respondWithError('sacco_update_failed', 'Unable to update deposit', 500);
  }
}
