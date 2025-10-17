import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
};

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ flags: DEFAULT_FLAGS });
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.from('feature_flags').select('key, enabled');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ flags: DEFAULT_FLAGS });
    }

    const flags = { ...DEFAULT_FLAGS };

    for (const row of data) {
      if (row?.key) {
        flags[row.key] = Boolean(row.enabled);
      }
    }

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('[flags] fallback due to error', error);
    return NextResponse.json({ flags: DEFAULT_FLAGS });
  }
}
