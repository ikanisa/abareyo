import { NextRequest } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import { errorResponse, successResponse } from '@/app/_lib/responses';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const phone = searchParams.get('phone');

  const supabase = getSupabase();
  if (!supabase) {
    return successResponse(id || phone ? null : []);
  }

  let query = supabase.from('users').select('*');
  if (id) {
    query = query.eq('id', id).limit(1);
  }
  if (phone) {
    query = query.eq('phone', phone).limit(1);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }
  if ((id || phone) && data && data.length === 0) {
    return errorResponse('User not found', 404);
  }
  return successResponse(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as TablesInsert<'users'> | null;
  if (!payload?.phone) {
    return errorResponse('phone is required');
  }

  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }

  await ensureWalletExists(supabase, data.id);

  return successResponse(data, 201);
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as TablesUpdate<'users'> & {
    id?: string;
  } | null;
  if (!payload?.id) {
    return errorResponse('id is required');
  }
  const { id, ...fields } = payload;
  const { data, error } = await supabase
    .from('users')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data);
}

async function ensureWalletExists(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  userId: string,
) {
  const { data } = await supabase.from('wallet').select('id').eq('user_id', userId).maybeSingle();
  if (!data) {
    await supabase.from('wallet').insert({ user_id: userId });
  }
}
