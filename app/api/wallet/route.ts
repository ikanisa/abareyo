import { NextRequest } from 'next/server';
import { getSupabase } from '../_lib/supabase';
import { errorResponse, successResponse } from '../_lib/responses';
import { requireAuthUser } from '../_lib/auth';
import type { TablesInsert } from '@/integrations/supabase/types';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const auth = await requireAuthUser(req, supabase);
  if ('response' in auth) {
    return auth.response;
  }
  const userId = auth.user.id;
  const requestedUserId = req.nextUrl.searchParams.get('userId');
  if (requestedUserId && requestedUserId !== userId) {
    return errorResponse('Forbidden', 403);
  }
  const { data, error } = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data ?? { user_id: userId, balance: 0 });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const auth = await requireAuthUser(req, supabase);
  if ('response' in auth) {
    return auth.response;
  }
  const payload = (await req.json().catch(() => null)) as {
    userId?: string;
    amount?: number;
    ref?: string;
  } | null;
  if (!payload?.amount || payload.amount <= 0) {
    return errorResponse('Positive amount is required');
  }

  const userId = auth.user.id;
  if (payload.userId && payload.userId !== userId) {
    return errorResponse('Forbidden', 403);
  }
  const amount = payload.amount;
  const ref = payload.ref ?? null;

  const existing = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing.error) {
    return errorResponse(existing.error.message, 500);
  }

  const balance = existing.data?.balance ?? 0;
  const walletId = existing.data?.id;
  const newBalance = balance + amount;

  const upsertPayload: TablesInsert<'wallet'> = {
    id: walletId,
    user_id: userId,
    balance: newBalance,
  };
  const { error: upsertError, data: updatedWallet } = await supabase
    .from('wallet')
    .upsert(upsertPayload)
    .select('*')
    .single();
  if (upsertError) {
    return errorResponse(upsertError.message, 500);
  }

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: userId,
    amount,
    ref,
    type: 'deposit',
    status: 'confirmed',
  });
  if (txError) {
    return errorResponse(txError.message, 500);
  }

  await supabase.rpc('increment_user_points', {
    p_user_id: userId,
    p_points_delta: amount,
  });

  return successResponse(updatedWallet, 201);
}
