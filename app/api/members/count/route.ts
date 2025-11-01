import { NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import { isSupabaseClient } from '@/app/api/_lib/supabase';

export async function GET() {
  const supabase = getSupabase();
  if (!isSupabaseClient(supabase)) {
    return NextResponse.json({ count: 0 });
  }

  const { count, error } = await supabase
    .from('public_members')
    .select('*', { head: true, count: 'exact' });

  if (error) {
    return NextResponse.json({ error: 'failed_to_count_members' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
