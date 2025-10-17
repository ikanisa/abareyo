import { NextRequest, NextResponse } from 'next/server';

import { requireAuthUser } from '@/app/_lib/auth';
import { getSupabase } from '@/app/_lib/supabase';

const DEFAULT_PREFS = {
  language: 'rw',
  notifications: { goals: true, kickoff: true, final: true, club: true },
};

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const memoryPrefs = new Map<string, typeof DEFAULT_PREFS>();

export async function GET(req: NextRequest) {
  const server = getSupabase();

  let user_id = DEMO_USER_ID;
  if (server) {
    const auth = await requireAuthUser(req, server);
    if ('response' in auth) {
      return auth.response;
    }
    user_id = auth.user.id;
  }

  if (!server) {
    return NextResponse.json({ prefs: memoryPrefs.get(user_id) ?? DEFAULT_PREFS });
  }

  const { data, error } = await server
    .from('user_prefs')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ prefs: DEFAULT_PREFS });
  }

  return NextResponse.json({ prefs: data || DEFAULT_PREFS });
}

export async function POST(req: NextRequest) {
  const server = getSupabase();

  let user_id = DEMO_USER_ID;
  if (server) {
    const auth = await requireAuthUser(req, server);
    if ('response' in auth) {
      return auth.response;
    }
    user_id = auth.user.id;
  }

  const body = await req.json();
  const upsert = {
    user_id,
    language: body.language || 'rw',
    notifications: body.notifications || DEFAULT_PREFS.notifications,
  };

  if (!server) {
    memoryPrefs.set(user_id, { language: upsert.language, notifications: upsert.notifications });
    return NextResponse.json({ ok: true });
  }

  const { error } = await server.from('user_prefs').upsert(upsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
