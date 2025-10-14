import { NextRequest } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import { errorResponse, successResponse } from '@/app/_lib/responses';

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return successResponse([]);
  }
  const { data, error } = await supabase
    .from('fan_posts')
    .select('*, users(name, avatar_url, tier)')
    .order('created_at', { ascending: false });
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    userId?: string;
    text?: string;
    mediaUrl?: string;
  } | null;
  if (!payload?.userId || !payload.text) {
    return errorResponse('userId and text are required');
  }

  const { data, error } = await supabase
    .from('fan_posts')
    .insert({
      user_id: payload.userId,
      text: payload.text,
      media_url: payload.mediaUrl ?? null,
    })
    .select('*')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data, 201);
}
