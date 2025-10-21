import { NextResponse } from 'next/server';

import { withAdminServiceClient } from '@/services/admin/service-client';

type SmsCandidate = {
  id: string;
  amount: number;
  ref: string | null;
  payer_mask: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  return withAdminServiceClient(
    async (db) => {
      const url = new URL(request.url);
      const target = Number(url.searchParams.get('amount') ?? 0);
      const minutes = Number(url.searchParams.get('minutes') ?? 2880);

      if (!Number.isFinite(target) || target <= 0) {
        return NextResponse.json({ candidates: [], target: 0, min: 0, max: 0, since: null });
      }

      const windowMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 2880;
      const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

      const delta = Math.max(Math.round(target * 0.05), 500);
      const min = Math.max(target - delta, 0);
      const max = target + delta;

      const { data, error } = await db
        .from('sms_parsed')
        .select('id, amount, ref, payer_mask, created_at')
        .gte('created_at', since)
        .gte('amount', min)
        .lte('amount', max)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        candidates: (data ?? []) as SmsCandidate[],
        target,
        min,
        max,
        since,
      });
    },
    {
      fallback: () => NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 }),
    },
  );
}
