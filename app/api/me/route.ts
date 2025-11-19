import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

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
  phone: string | null;
  user_code: string | null;
};

export async function GET(req: NextRequest) {
  const response = NextResponse.next();
  try {
    const supabase = getSupabaseServerClient({ request: req, response });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ me: null }, { status: 401, headers: response.headers });
    }

    const { data, error } = await supabase
      .from('users')
      .select(
        'id, name, display_name, region, fan_club, public_profile, language, momo_number, joined_at, avatar_url, phone, user_code',
      )
      .eq('id', user.id)
      .maybeSingle<MemberProfile>();

    if (error) {
      return NextResponse.json({ error: 'failed_to_load_profile' }, { status: 500, headers: response.headers });
    }

    if (!data) {
      return NextResponse.json({ me: null }, { status: 404, headers: response.headers });
    }

    return NextResponse.json({ me: data }, { headers: response.headers });
  } catch (error) {
    console.error('[me] Supabase auth failed', error);
    return NextResponse.json({ me: null }, { status: 500, headers: response.headers });
  }
}
