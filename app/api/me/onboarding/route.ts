import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/_lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type SupabaseLike = ReturnType<typeof getSupabase>;

const MEMBER_COOKIE = 'gikundiro:member-id';
const MEMBER_PROFILE_COOKIE = 'gikundiro:member-profile';

const sanitizeDigits = (value: string, { allowPlus = false, max = 20 } = {}) => {
  const pattern = allowPlus ? /[^0-9+]/g : /\D/g;
  const cleaned = value.replace(pattern, '');
  return cleaned.slice(0, max);
};

const normalizeWhatsapp = (input: unknown): string | null => {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const digits = sanitizeDigits(trimmed, { allowPlus: true, max: 20 });
  if (!digits) return null;

  if (digits.startsWith('+')) {
    return `+${digits.slice(1)}`;
  }

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith('2507')) {
    return `+${digits}`;
  }

  if (digits.startsWith('07')) {
    return `+250${digits.slice(1)}`;
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return `+250${digits}`;
  }

  return `+${digits}`;
};

const deriveMomoFromWhatsapp = (whatsapp: string): string | null => {
  const digits = sanitizeDigits(whatsapp, { allowPlus: false, max: 20 });
  if (!digits) return null;

  if (digits.startsWith('2507')) {
    return `0${digits.slice(3)}`;
  }

  if (digits.startsWith('07')) {
    return digits;
  }

  return digits;
};

const normalizeMomo = (input: unknown): string | null => {
  if (typeof input !== 'string') return null;
  const digits = sanitizeDigits(input, { allowPlus: false, max: 20 });
  if (!digits) return null;
  if (digits.startsWith('2507')) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith('7') && digits.length === 9) {
    return `0${digits}`;
  }
  return digits.startsWith('0') ? digits : `0${digits}`;
};

const generateFanCode = () => {
  const value = Math.floor(100000 + Math.random() * 900000);
  return value.toString();
};

const resolveUserCode = async (
  supabase: SupabaseLike,
  current: string | null,
): Promise<{ code: string; changed: boolean }> => {
  if (current && current.length === 6) {
    return { code: current, changed: false };
  }

  const candidate = generateFanCode();
  if (!supabase) {
    return { code: candidate, changed: true };
  }

  let attempts = 0;
  while (attempts < 5) {
    const tryCode = attempts === 0 ? candidate : generateFanCode();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('user_code', tryCode)
      .maybeSingle();

    if (!error && !data) {
      return { code: tryCode, changed: true };
    }
    attempts += 1;
  }

  return { code: candidate, changed: true };
};

type OnboardingPayload = {
  user_id?: string;
  whatsappNumber?: string;
  useWhatsappForMomo?: boolean;
  momoNumber?: string | null;
  publicProfile?: boolean;
};

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const cookieStore = cookies();

  const body = (await req.json().catch(() => null)) as OnboardingPayload | null;
  if (!body) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const whatsapp = normalizeWhatsapp(body.whatsappNumber);
  if (!whatsapp) {
    return NextResponse.json({ error: 'whatsapp_required' }, { status: 400 });
  }

  const sameAsMomo = body.useWhatsappForMomo !== false;
  const momo = sameAsMomo ? deriveMomoFromWhatsapp(whatsapp) : normalizeMomo(body.momoNumber);
  if (!momo) {
    return NextResponse.json({ error: 'momo_required' }, { status: 400 });
  }

  const publicProfile = body.publicProfile !== false;

  const headerId = req.headers.get('x-client-id') ?? req.headers.get('x-user-id');
  const cookieId = cookieStore.get(MEMBER_COOKIE)?.value ?? undefined;

  let userId = body.user_id ?? headerId ?? cookieId;
  if (!userId) {
    userId = randomUUID();
  }

  const now = new Date().toISOString();

  let existingUser:
    | (TablesInsert<'users'> & { joined_at?: string | null; avatar_url?: string | null; user_code?: string | null })
    | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, joined_at, avatar_url, user_code')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'failed_to_load_user' }, { status: 500 });
    }

    existingUser = data;
  }

  const { code: userCode, changed: codeChanged } = await resolveUserCode(supabase, existingUser?.user_code ?? null);

  const profileRecord = {
    id: userId,
    name: null,
    display_name: `Fan #${userCode}`,
    region: 'Global',
    fan_club: 'Worldwide',
    public_profile: publicProfile,
    language: 'rw',
    momo_number: momo,
    joined_at: existingUser?.joined_at ?? now,
    avatar_url: existingUser?.avatar_url ?? '',
    phone: whatsapp,
    user_code: userCode,
  } as const;

  if (!supabase) {
    persistCookies(cookieStore, userId, profileRecord);
    return NextResponse.json({ ok: true, id: userId, offline: true, code: userCode });
  }

  if (existingUser) {
    const updates: TablesUpdate<'users'> = {
      name: null,
      display_name: profileRecord.display_name,
      region: profileRecord.region,
      fan_club: profileRecord.fan_club,
      public_profile: publicProfile,
      language: profileRecord.language,
      momo_number: momo,
      phone: whatsapp,
      user_code: codeChanged ? userCode : existingUser.user_code,
    };

    const { error: updateError } = await supabase.from('users').update(updates).eq('id', userId);
    if (updateError) {
      return NextResponse.json({ error: 'failed_to_save_profile' }, { status: 500 });
    }
  } else {
    const insert: TablesInsert<'users'> = {
      id: userId,
      name: null,
      display_name: profileRecord.display_name,
      region: profileRecord.region,
      fan_club: profileRecord.fan_club,
      public_profile: publicProfile,
      language: profileRecord.language,
      momo_number: momo,
      joined_at: profileRecord.joined_at,
      phone: whatsapp,
      user_code: userCode,
    };

    const { error: insertError } = await supabase.from('users').insert(insert);
    if (insertError) {
      return NextResponse.json({ error: 'failed_to_create_profile' }, { status: 500 });
    }
  }

  persistCookies(cookieStore, userId, profileRecord);

  return NextResponse.json({ ok: true, id: userId, code: userCode });
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
    phone: string;
    user_code: string;
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
