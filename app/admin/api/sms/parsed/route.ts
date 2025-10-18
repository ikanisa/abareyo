import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';
import { getSupabaseSecretKey, getSupabaseUrl } from '@/integrations/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const isSupabaseConfigured = () => Boolean(getSupabaseUrl() && getSupabaseSecretKey());

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ sms: [] }, { status: 503, headers: { 'x-admin-offline': 'supabase-missing' } });
    }
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') ?? undefined;
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '20', 10), 100);

    let builder = supabase
      .from('sms_parsed')
      .select('id, sms_id, ref, amount, payer_mask, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (query) {
      const sanitized = query.replace(/'/g, "''");
      const numeric = Number.parseInt(query, 10);
      if (!Number.isNaN(numeric)) {
        builder = builder.or([
          `ref.ilike.%${sanitized}%`,
          `payer_mask.ilike.%${sanitized}%`,
          `amount.eq.${numeric}`,
        ].join(','));
      } else {
        builder = builder.or([
          `ref.ilike.%${sanitized}%`,
          `payer_mask.ilike.%${sanitized}%`,
        ].join(','));
      }
    }

    const { data, error } = await builder;
    if (error) throw error;

    return NextResponse.json({ sms: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to search parsed SMS messages', error);
    return NextResponse.json({ error: 'sms_search_failed' }, { status: 500 });
  }
}
