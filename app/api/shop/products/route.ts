import { NextRequest } from 'next/server';
import { getSupabase } from '../../_lib/supabase';
import { errorResponse, successResponse } from '../../_lib/responses';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const id = req.nextUrl.searchParams.get('id');

  let query = supabase.from('shop_products').select('*').order('name');
  if (id) {
    query = query.eq('id', id).limit(1);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }
  if (id && data && data.length === 0) {
    return errorResponse('Product not found', 404);
  }
  return successResponse(id ? data?.[0] ?? null : data ?? []);
}
