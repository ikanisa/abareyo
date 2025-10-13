import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '../../_lib/responses';
import { getSupabase } from '../../_lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return errorResponse('userId is required');
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, status')
    .eq('user_id', userId);
  if (error) {
    return errorResponse(error.message, 500);
  }

  const summary = (data ?? []).reduce(
    (acc, tx) => {
      const bucket = tx.status === 'confirmed' ? 'confirmed' : 'pending';
      return {
        ...acc,
        [bucket]: acc[bucket] + (tx.amount ?? 0),
      };
    },
    { pending: 0, confirmed: 0 },
  );

  return successResponse(summary);
}
