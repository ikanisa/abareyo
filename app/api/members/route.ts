import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import type { Database } from '@/integrations/supabase/types';

type PublicMember = Database['public']['Views']['public_members']['Row'];

export async function GET(_req: NextRequest) {
  const supabase = getSupabase();
  const fallback = { members: [] as PublicMember[] };

  if (!supabase) {
    return NextResponse.json(fallback);
  }

  const { data, error } = await supabase
    .from('public_members')
    .select('id, display_name, region, fan_club, joined_at, avatar_url, phone, momo_number, user_code')
    .order('joined_at', { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json({ error: 'failed_to_load_members' }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
