import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey);
};

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ matches: [] }, { status: 503, headers: { 'x-admin-offline': 'supabase-missing' } });
    }
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const upcomingOnly = searchParams.get('upcoming') === 'true';

    let builder = supabase
      .from('matches')
      .select('id, title, date, venue, comp, status')
      .order('date', { ascending: false });

    if (upcomingOnly) {
      builder = builder.gte('date', new Date().toISOString());
    }

    const { data, error } = await builder;
    if (error) throw error;

    return NextResponse.json({ matches: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load match catalog for admin', error);
    return NextResponse.json({ error: 'matches_fetch_failed' }, { status: 500 });
  }
}
