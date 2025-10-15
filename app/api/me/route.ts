import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';

const MEMBER_COOKIE = 'gikundiro:member-id';
const MEMBER_PROFILE_COOKIE = 'gikundiro:member-profile';

type MemberProfile = {
  id: string;
  name: string | null;
  display_name: string | null;
  region: string | null;
  fan_club: string | null;
  public_profile: boolean | null;
  language: string | null;
  momo_number: string | null;
  joined_at: string | null;
  avatar_url: string | null;
};

const parseProfileCookie = (raw: string | undefined) => {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(decodeURIComponent(raw)) as MemberProfile;
  } catch (error) {
    console.warn('Unable to parse fallback member profile', error);
    return null;
  }
};

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const cookieStore = cookies();
  const headerId = req.headers.get('x-client-id') ?? req.headers.get('x-user-id');
  const cookieId = cookieStore.get(MEMBER_COOKIE)?.value ?? undefined;
  const userId = headerId ?? cookieId;

  if (!userId) {
    const fallback = parseProfileCookie(cookieStore.get(MEMBER_PROFILE_COOKIE)?.value);
    if (fallback) {
      return NextResponse.json({ me: fallback });
    }
    return NextResponse.json({ me: null });
  }

  if (!supabase) {
    const fallback = parseProfileCookie(cookieStore.get(MEMBER_PROFILE_COOKIE)?.value);
    if (fallback && fallback.id === userId) {
      return NextResponse.json({ me: fallback });
    }
    return NextResponse.json({ me: null });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, display_name, region, fan_club, public_profile, language, momo_number, joined_at, avatar_url')
    .eq('id', userId)
    .maybeSingle<MemberProfile>();

  if (error) {
    return NextResponse.json({ error: 'failed_to_load_profile' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ me: null });
  }

  cookieStore.set({
    name: MEMBER_COOKIE,
    value: userId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  cookieStore.set({
    name: MEMBER_PROFILE_COOKIE,
    value: encodeURIComponent(JSON.stringify(data)),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return NextResponse.json({ me: data });
}
