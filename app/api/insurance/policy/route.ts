import { NextRequest } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import { errorResponse, successResponse } from '@/app/_lib/responses';

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    quoteId?: string;
    number?: string;
    validFrom?: string;
    validTo?: string;
    freeTicketIssued?: boolean;
  } | null;
  if (!payload?.quoteId || !payload.number || !payload.validFrom || !payload.validTo) {
    return errorResponse('quoteId, number, validFrom and validTo are required');
  }

  const { data, error } = await supabase
    .from('policies')
    .insert({
      quote_id: payload.quoteId,
      number: payload.number,
      valid_from: payload.validFrom,
      valid_to: payload.validTo,
      free_ticket_issued: payload.freeTicketIssued ?? false,
    })
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }

  await supabase
    .from('insurance_quotes')
    .update({ status: 'issued' })
    .eq('id', payload.quoteId);

  return successResponse(data, 201);
}
