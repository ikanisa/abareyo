import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const MEMBER_COOKIE = 'gikundiro:member-id';
const MEMBER_PROFILE_COOKIE = 'gikundiro:member-profile';

const sanitize = (value: unknown, max = 120) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, max);
};

type OnboardingPayload = {
  user_id?: string;
  fullName?: string;
  displayName?: string;
  language?: string;
  region?: string;
  fanClub?: string;
  publicProfile?: boolean;
  consent?: boolean;
  momoNumber?: string | null;
};

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const cookieStore = cookies();

  const body = (await req.json().catch(() => null)) as OnboardingPayload | null;
  if (!body) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const fullName = sanitize(body.fullName ?? '', 120);
  if (!fullName) {
    return NextResponse.json({ error: 'full_name_required' }, { status: 400 });
  }

  if (body.consent === false) {
    return NextResponse.json({ error: 'consent_required' }, { status: 400 });
  }

  const headerId = req.headers.get('x-client-id') ?? req.headers.get('x-user-id');
  const cookieId = cookieStore.get(MEMBER_COOKIE)?.value ?? undefined;

  let userId = body.user_id ?? headerId ?? cookieId;
  if (!userId) {
    userId = randomUUID();
  }

  const displayNameRaw = sanitize(body.displayName ?? '', 80);
  const displayName = displayNameRaw || fullName;
  const region = sanitize(body.region ?? '', 80) || null;
  const fanClub = sanitize(body.fanClub ?? '', 80) || null;
  const publicProfile = Boolean(body.publicProfile);
  const language = body.language === 'en' ? 'en' : 'rw';
  const momoDigits = typeof body.momoNumber === 'string' ? body.momoNumber.replace(/[^0-9+]/g, '') : null;
  const momoNumber = momoDigits ? momoDigits.slice(0, 20) : null;

  const profileRecord = {
    id: userId,
    name: fullName || null,
    display_name: displayName || null,
    region,
    fan_club: fanClub,
    public_profile: publicProfile,
    language,
    momo_number: momoNumber,
    joined_at: new Date().toISOString(),
    avatar_url: '',
  };

  if (!supabase) {
    persistCookies(cookieStore, userId, profileRecord);
    return NextResponse.json({ ok: true, id: userId, offline: true });
  }

  const { data: existing, error: loadError } = await supabase
    .from('users')
    .select('id, joined_at, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: 'failed_to_load_user' }, { status: 500 });
  }

  if (existing) {
    const updates: TablesUpdate<'users'> = {
      name: fullName,
      display_name: displayName,
      region,
      fan_club: fanClub,
      public_profile: publicProfile,
      language,
      momo_number: momoNumber,
    };

    const { error: updateError } = await supabase.from('users').update(updates).eq('id', userId);
    if (updateError) {
      return NextResponse.json({ error: 'failed_to_save_profile' }, { status: 500 });
    }

    profileRecord.joined_at = existing.joined_at ?? profileRecord.joined_at;
    profileRecord.avatar_url = existing.avatar_url ?? '';
  } else {
    const insert: TablesInsert<'users'> = {
      id: userId,
      name: fullName,
      display_name: displayName,
      region,
      fan_club: fanClub,
      public_profile: publicProfile,
      language,
      momo_number: momoNumber,
      joined_at: profileRecord.joined_at,
    };

    const { error: insertError } = await supabase.from('users').insert(insert);
    if (insertError) {
      return NextResponse.json({ error: 'failed_to_create_profile' }, { status: 500 });
    }
  }

  persistCookies(cookieStore, userId, profileRecord);

  return NextResponse.json({ ok: true, id: userId });
}

function persistCookies(
  cookieStore: ReturnType<typeof cookies>,
  userId: string,
  profile: {
    id: string;
    name: string | null;
    display_name: string | null;
    region: string | null;
    fan_club: string | null;
    public_profile: boolean;
    language: string;
    momo_number: string | null;
    joined_at: string;
    avatar_url: string;
  },
) {
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
    value: encodeURIComponent(JSON.stringify(profile)),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}
