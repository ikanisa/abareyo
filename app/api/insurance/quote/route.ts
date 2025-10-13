import { NextRequest } from 'next/server';
import { getSupabase } from '../../_lib/supabase';
import { errorResponse, successResponse } from '../../_lib/responses';

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    userId?: string;
    motoType?: string;
    plate?: string;
    premium?: number;
    ticketPerk?: boolean;
    ref?: string;
  } | null;
  if (!payload?.userId || !payload.premium) {
    return errorResponse('userId and premium are required');
  }

  const { data, error } = await supabase
    .from('insurance_quotes')
    .insert({
      user_id: payload.userId,
      moto_type: payload.motoType ?? null,
      plate: payload.plate ?? null,
      premium: payload.premium,
      ticket_perk: payload.ticketPerk ?? false,
      ref: payload.ref ?? null,
      status: 'quoted',
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
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    id?: string;
    status?: 'quoted' | 'paid' | 'issued';
    ticketPerk?: boolean;
    ref?: string | null;
  } | null;
  if (!payload?.id) {
    return errorResponse('id is required');
  }

  const updates: Record<string, unknown> = {};
  if (payload.status) updates.status = payload.status;
  if (typeof payload.ticketPerk === 'boolean') updates.ticket_perk = payload.ticketPerk;
  if (payload.ref !== undefined) updates.ref = payload.ref;

  const { data, error } = await supabase
    .from('insurance_quotes')
    .update(updates)
    .eq('id', payload.id)
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data);
}
