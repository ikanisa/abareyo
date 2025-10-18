import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/integrations/supabase/server';

type CommunityPostRecord = {
  id: string;
  user_id: string;
  text: string;
  media_url: string | null;
  status: 'visible' | 'hidden';
  created_at: string;
};

const server = createServiceSupabaseClient();
const COMMUNITY_POSTS_TABLE = 'community_posts';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const memoryPosts: CommunityPostRecord[] = [
  {
    id: randomUUID(),
    user_id: DEMO_USER_ID,
    text: 'Karibu kuri GIKUNDIRO! Share your voice before kickoff.',
    media_url: null,
    status: 'visible',
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  if (!server) {
    return NextResponse.json({ posts: memoryPosts });
  }

  const { data, error } = await server
    .from(COMMUNITY_POSTS_TABLE as never)
    .select('id,user_id,text,media_url,status,created_at')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ posts: memoryPosts });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text: string = (body.text ?? '').trim();
  const mediaUrl: string | null = body.media_url ? String(body.media_url) : null;

  if (!text) {
    return NextResponse.json({ error: 'missing_text' }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: 'text_too_long' }, { status: 400 });
  }

  const post: CommunityPostRecord = {
    id: randomUUID(),
    user_id: DEMO_USER_ID,
    text,
    media_url: mediaUrl,
    status: 'visible',
    created_at: new Date().toISOString(),
  };

  if (!server) {
    memoryPosts.unshift(post);
    return NextResponse.json({ post }, { status: 201 });
  }

  const { data, error } = await server
    .from(COMMUNITY_POSTS_TABLE as never)
    .insert({ user_id: DEMO_USER_ID, text, media_url: mediaUrl ?? undefined } as never)
    .select('id,user_id,text,media_url,status,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
