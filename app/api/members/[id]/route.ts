import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'member_not_found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('public_members')
    .select('id, display_name, region, fan_club, joined_at, avatar_url, phone, momo_number, user_code')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'member_not_found' }, { status: 404 });
  }

  if (!data) {
    return NextResponse.json({ error: 'member_not_found' }, { status: 404 });
  }

  return NextResponse.json({ member: data });
}
