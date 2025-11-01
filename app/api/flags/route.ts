import { NextResponse } from 'next/server';

import { tryGetSupabaseServerAnonClient } from '@/lib/db';

const DEFAULT_FLAGS = {
  'features.personalization': true,
  'features.liveScores': true,
  'features.pushNotifications': false,
  'features.curatedContent': true,
  'features.community': true,
  'features.media': true,
  'features.partnerWebviews': true,
  'features.wearables': false,
  'features.streamingCast': false,
  'features.ticketScanner': false,
  'features.ticketTransferV2': false,
  'features.chatLiveSupport': false,
};

export async function GET() {
  const client = tryGetSupabaseServerAnonClient();

  if (!client) {
    return NextResponse.json({ flags: DEFAULT_FLAGS });
  }

  try {
    const { data, error } = await client.from('feature_flags').select('key, enabled');

    if (error) {
      if ((error as { code?: string }).code === 'PGRST205') {
        return NextResponse.json({ flags: DEFAULT_FLAGS });
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ flags: DEFAULT_FLAGS });
    }

    const flags: Record<string, boolean> = { ...DEFAULT_FLAGS };

    for (const row of data) {
      if (row?.key) {
        flags[row.key] = Boolean(row.enabled);
      }
    }

    return NextResponse.json({ flags });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      (error as { message?: string }).message === 'Invalid API key'
    ) {
      console.warn('[flags] Supabase credentials invalid; serving defaults.');
      return NextResponse.json({ flags: DEFAULT_FLAGS });
    }
    console.error('[flags] fallback due to error', error);
    return NextResponse.json({ flags: DEFAULT_FLAGS });
  }
}
