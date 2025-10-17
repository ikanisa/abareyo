import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuthUser } from '@/app/_lib/auth';
import { getSupabase } from '@/app/_lib/supabase';

type FavoriteRecord = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const memoryFavorites: FavoriteRecord[] = [];

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
    return NextResponse.json({ items: memoryFavorites.filter((favorite) => favorite.user_id === user_id) });
  }

  const { data, error } = await server.from('user_favorites').select('*').eq('user_id', user_id);
  if (error) {
    return NextResponse.json({ items: [] });
  }
  return NextResponse.json({ items: data || [] });
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
  const record = {
    id: randomUUID(),
    user_id,
    entity_type: String(body.entity_type ?? 'team'),
    entity_id: String(body.entity_id ?? ''),
    created_at: new Date().toISOString(),
  } satisfies FavoriteRecord;

  if (!record.entity_id) {
    return NextResponse.json({ error: 'missing_entity' }, { status: 400 });
  }

  if (!server) {
    memoryFavorites.unshift(record);
    return NextResponse.json({ ok: true });
  }

  const { error } = await server
    .from('user_favorites')
    .insert({ user_id, entity_type: record.entity_type, entity_id: record.entity_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const server = getSupabase();

  let user_id = DEMO_USER_ID;
  if (server) {
    const auth = await requireAuthUser(req, server);
    if ('response' in auth) {
      return auth.response;
    }
    user_id = auth.user.id;
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  if (!server) {
    const index = memoryFavorites.findIndex((favorite) => favorite.id === id && favorite.user_id === user_id);
    if (index >= 0) {
      memoryFavorites.splice(index, 1);
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await server.from('user_favorites').delete().eq('id', id).eq('user_id', user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
