import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '../../../_lib/responses';
import { getSupabase } from '../../../_lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const payload = (await req.json().catch(() => null)) as { passId?: string; userId?: string } | null;
  if (!payload?.passId || !payload.userId) {
    return errorResponse('passId and userId are required');
  }

  const newToken = randomUUID();
  const { data, error } = await supabase
    .from('tickets')
    .update({ qr_token: newToken, updated_at: new Date().toISOString() })
    .eq('id', payload.passId)
    .eq('user_id', payload.userId)
    .select('id, updated_at')
    .maybeSingle();
  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!data) {
    return errorResponse('Pass not found', 404);
  }

  return successResponse({ passId: data.id, token: newToken, rotatedAt: data.updated_at, validForSeconds: 3600 });
}
