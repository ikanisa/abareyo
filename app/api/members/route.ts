import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import type { Database } from '@/integrations/supabase/types';

type PublicMember = Database['public']['Views']['public_members']['Row'];

const MAX_RESULTS = 200;

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const fallback = { members: [] as PublicMember[] };

  if (!supabase) {
    return NextResponse.json(fallback);
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();
  const region = searchParams.get('region')?.trim();
  const fanClub = searchParams.get('fan_club')?.trim();
  const sortParam = searchParams.get('sort')?.trim() ?? 'recent';

  let query = supabase
    .from('public_members')
    .select('id, display_name, region, fan_club, joined_at, avatar_url')
    .limit(MAX_RESULTS);

  if (region) {
    query = query.eq('region', region);
  }

  if (fanClub) {
    query = query.eq('fan_club', fanClub);
  }

  if (q) {
    query = query.ilike('display_name', `%${q}%`);
  }

  if (sortParam === 'name') {
    query = query.order('display_name', { ascending: true });
  } else {
    query = query.order('joined_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'failed_to_load_members' }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
