import { NextRequest } from 'next/server';
import { getSupabase } from '../../_lib/supabase';
import { errorResponse, successResponse } from '../../_lib/responses';

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const payload = (await req.json().catch(() => null)) as {
    userId?: string;
    saccoName?: string;
    amount?: number;
    ref?: string;
  } | null;
  if (!payload?.userId || !payload.saccoName || !payload.amount) {
    return errorResponse('userId, saccoName and amount are required');
  }

  const { data, error } = await supabase
    .from('sacco_deposits')
    .insert({
      user_id: payload.userId,
      sacco_name: payload.saccoName,
      amount: payload.amount,
      ref: payload.ref ?? null,
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data, 201);
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabase();
  const payload = (await req.json().catch(() => null)) as {
    id?: string;
    status?: 'pending' | 'confirmed';
    ref?: string | null;
  } | null;
  if (!payload?.id) {
    return errorResponse('id is required');
  }

  const updates: Record<string, unknown> = {};
  if (payload.status) updates.status = payload.status;
  if (payload.ref !== undefined) updates.ref = payload.ref;

  const { data, error } = await supabase
    .from('sacco_deposits')
    .update(updates)
    .eq('id', payload.id)
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }

  if (payload.status === 'confirmed') {
    await supabase.from('transactions').insert({
      user_id: data.user_id,
      amount: data.amount,
      type: 'deposit',
      ref: data.ref,
      status: 'confirmed',
    });
    if (data.user_id) {
      await supabase.rpc('increment_user_points', {
        p_user_id: data.user_id,
        p_points_delta: data.amount,
      });
    }
  }

  return successResponse(data);
}
