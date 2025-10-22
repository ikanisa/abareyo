import { NextResponse } from 'next/server';

import { tryGetServiceSupabaseClient } from '@/app/api/_lib/supabase';

const DEFAULT_PREFS = {
  language: 'rw',
  notifications: { goals: true, kickoff: true, final: true, club: true },
};

const USER_PREFS_TABLE = 'user_prefs';

const memoryPrefs = new Map<string, typeof DEFAULT_PREFS>();

export async function GET() {
  // MVP fetch default user (replace with session)
  const user_id = '00000000-0000-0000-0000-000000000001';

  const supabase = tryGetServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ prefs: memoryPrefs.get(user_id) ?? DEFAULT_PREFS });
  }

  const { data, error } = await supabase
    .from(USER_PREFS_TABLE as never)
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ prefs: DEFAULT_PREFS });
  }

  return NextResponse.json({ prefs: data || DEFAULT_PREFS });
}

export async function POST(req: Request) {
  const body = await req.json();
  const user_id = '00000000-0000-0000-0000-000000000001';
  const upsert = {
    user_id,
    language: body.language || 'rw',
    notifications: body.notifications || DEFAULT_PREFS.notifications,
  };

  const supabase = tryGetServiceSupabaseClient();
  if (!supabase) {
    memoryPrefs.set(user_id, { language: upsert.language, notifications: upsert.notifications });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from(USER_PREFS_TABLE as never)
    .upsert(upsert as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
