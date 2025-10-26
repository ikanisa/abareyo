import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';
import { getSupabaseSecretKey, getSupabaseUrl } from '@/integrations/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const isSupabaseConfigured = () => Boolean(getSupabaseUrl() && getSupabaseSecretKey());

const mapInboundRecord = (row: {
  id: string;
  text: string;
  from_msisdn?: string | null;
  to_msisdn?: string | null;
  received_at?: string | null;
  ingest_status?: string | null;
  sms_parsed?: {
    id: string;
    amount?: number | null;
    currency?: string | null;
    ref?: string | null;
    confidence?: number | null;
    matched_entity?: string | null;
  } | null;
}) => ({
  id: row.id,
  text: row.text,
  fromMsisdn: row.from_msisdn ?? 'unknown',
  toMsisdn: row.to_msisdn ?? null,
  receivedAt: row.received_at ?? new Date().toISOString(),
  ingestStatus: (row.ingest_status as 'received' | 'parsed' | 'error' | 'manual_review' | undefined) ?? 'received',
  parsed: row.sms_parsed
    ? {
        id: row.sms_parsed.id,
        amount: Number(row.sms_parsed.amount ?? 0),
        currency: row.sms_parsed.currency ?? 'RWF',
        ref: row.sms_parsed.ref ?? 'UNKNOWN',
        confidence: Number(row.sms_parsed.confidence ?? 0),
        matchedEntity: row.sms_parsed.matched_entity ?? null,
      }
    : null,
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { sms: [] },
        { status: 503, headers: { 'x-admin-offline': 'supabase-missing' } },
      );
    }

    const supabase = getSupabaseAdmin();
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam ?? '50'), 1), 200);

    const { data, error } = await supabase
      .from('sms_raw')
      .select(
        'id, text, from_msisdn, to_msisdn, received_at, ingest_status, sms_parsed(id, amount, currency, ref, confidence, matched_entity)',
      )
      .order('received_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return NextResponse.json({
      sms: rows.map((row) => mapInboundRecord(row as Parameters<typeof mapInboundRecord>[0])),
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load inbound SMS records', error);
    return NextResponse.json({ error: 'sms_inbound_fetch_failed' }, { status: 500 });
  }
}
