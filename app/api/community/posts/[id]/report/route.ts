import { NextResponse } from 'next/server';

import { tryGetServiceSupabaseClient } from '@/app/api/_lib/supabase';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'missing_post_id' }, { status: 400 });
  }

  const supabase = tryGetServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const { error } = await supabase
    .from('community_reports' as never)
    .insert({ post_id: id, reason: 'user_flagged' } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
