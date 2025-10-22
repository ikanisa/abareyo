import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { tryGetServiceSupabaseClient } from '@/app/api/_lib/supabase';

type FavoriteRecord = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

const USER_FAVORITES_TABLE = 'user_favorites';

const memoryFavorites: FavoriteRecord[] = [];

export async function GET() {
  const user_id = '00000000-0000-0000-0000-000000000001';

  const supabase = tryGetServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ items: memoryFavorites.filter((favorite) => favorite.user_id === user_id) });
  }

  const { data, error } = await supabase
    .from(USER_FAVORITES_TABLE as never)
    .select('*')
    .eq('user_id', user_id);
  if (error) {
    return NextResponse.json({ items: [] });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: Request) {
  const user_id = '00000000-0000-0000-0000-000000000001';
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

  const supabase = tryGetServiceSupabaseClient();
  if (!supabase) {
    memoryFavorites.unshift(record);
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from(USER_FAVORITES_TABLE as never)
    .insert({ user_id, entity_type: record.entity_type, entity_id: record.entity_id } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user_id = '00000000-0000-0000-0000-000000000001';
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const supabase = tryGetServiceSupabaseClient();
  if (!supabase) {
    const index = memoryFavorites.findIndex((favorite) => favorite.id === id && favorite.user_id === user_id);
    if (index >= 0) {
      memoryFavorites.splice(index, 1);
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from(USER_FAVORITES_TABLE as never)
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
