import { NextRequest } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import { errorResponse, successResponse } from '@/app/_lib/responses';
import type { Json } from '@/integrations/supabase/types';

type PollRecord = {
  id: string;
  question: string;
  options: Json;
  results: Json;
  active: boolean;
};

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    const id = req.nextUrl.searchParams.get('id');
    return successResponse(id ? null : []);
  }
  const id = req.nextUrl.searchParams.get('id');
  let query = supabase.from('polls').select('*');
  if (id) {
    query = query.eq('id', id).limit(1);
  }
  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }
  if (id) {
    if (!data || data.length === 0) {
      return errorResponse('Poll not found', 404);
    }
    return successResponse(data[0]);
  }
  return successResponse(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    pollId?: string;
    option?: string;
  } | null;
  if (!payload?.pollId || !payload.option) {
    return errorResponse('pollId and option are required');
  }

  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', payload.pollId)
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }
  const typedPoll = poll as PollRecord;
  if (!typedPoll.active) {
    return errorResponse('Poll is closed', 400);
  }
  const options = Array.isArray(typedPoll.options) ? (typedPoll.options as string[]) : [];
  if (!options.includes(payload.option)) {
    return errorResponse('Invalid option', 400);
  }

  const results = (typedPoll.results as Record<string, number>) ?? {};
  const current = results[payload.option] ?? 0;
  const updatedResults = { ...results, [payload.option]: current + 1 };

  const { data: updated, error: updateError } = await supabase
    .from('polls')
    .update({ results: updatedResults })
    .eq('id', payload.pollId)
    .select('*')
    .single();
  if (updateError) {
    return errorResponse(updateError.message, 500);
  }
  return successResponse(updated);
}
