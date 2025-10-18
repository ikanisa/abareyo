import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

type QuoteUpdatePayload = {
  id: string;
  status?: string;
  ticket_perk?: boolean;
};

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.services']);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('insurance_quotes')
      .select('id, user_id, premium, status, ticket_perk, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    adminLogger.info('services.insurance.list', { admin: session.user.id, count: data?.length ?? 0 });
    return respond({ quotes: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('services.insurance.list_failed', { error: (error as Error).message });
    return respondWithError('insurance_fetch_failed', 'Unable to load insurance quotes', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.services']);
    const payload = (await request.json()) as QuoteUpdatePayload;

    if (!payload?.id) {
      return respondWithError('quote_id_required', 'Quote id is required', 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: before, error: beforeError } = await supabase
      .from('insurance_quotes')
      .select('id, status, ticket_perk, premium, user_id')
      .eq('id', payload.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) {
      return respondWithError('quote_not_found', 'Quote not found', 404);
    }

    const updates: Record<string, unknown> = {};
    if (payload.status) updates.status = payload.status;
    if (payload.ticket_perk !== undefined) updates.ticket_perk = payload.ticket_perk;

    if (Object.keys(updates).length === 0) {
      return respondWithError('quote_no_changes', 'No changes supplied', 400);
    }

    const { data: updated, error } = await supabase
      .from('insurance_quotes')
      .update(updates)
      .eq('id', payload.id)
      .select('id, status, ticket_perk, premium, user_id, updated_at')
      .single();

    if (error) throw error;

    await recordAudit(supabase, {
      action: 'insurance.quote.update',
      entityType: 'insurance_quote',
      entityId: payload.id,
      before,
      after: updated,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    adminLogger.info('services.insurance.updated', { admin: session.user.id, quote: payload.id });
    return respond({ quote: updated });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('services.insurance.update_failed', { error: (error as Error).message });
    return respondWithError('insurance_update_failed', 'Unable to update quote', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.services']);
    const payload = (await request.json()) as { quote_id: string };
    if (!payload?.quote_id) {
      return respondWithError('quote_id_required', 'Quote id required', 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: quote, error } = await supabase
      .from('insurance_quotes')
      .select('id, status, ticket_perk, user_id, premium')
      .eq('id', payload.quote_id)
      .maybeSingle();

    if (error) throw error;
    if (!quote) {
      return respondWithError('quote_not_found', 'Quote not found', 404);
    }

    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .insert({
        quote_id: quote.id,
        number: `POL-${Date.now().toString(36).toUpperCase()}`,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, number, quote_id, valid_from, valid_to')
      .single();

    if (policyError) throw policyError;

    await supabase
      .from('insurance_quotes')
      .update({ status: 'issued', ticket_perk: quote.ticket_perk })
      .eq('id', quote.id);

    await recordAudit(supabase, {
      action: 'insurance.policy.issue',
      entityType: 'policy',
      entityId: policy.id,
      before: quote,
      after: policy,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
      context: { trigger: 'admin_manual' },
    });

    adminLogger.info('services.insurance.policy_issued', { admin: session.user.id, quote: quote.id, policy: policy.id });
    return respond({ policy });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('services.insurance.policy_failed', { error: (error as Error).message });
    return respondWithError('policy_issue_failed', 'Unable to issue policy', 500);
  }
}
