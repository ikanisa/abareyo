import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Match centre data is sourced from local fixtures defined in `/app/_data/matches`.
// We optionally override `matches` with rows from Supabase if configured.
import {
  highlightClips,
  leagueTable,
  matches as fixtureMatches,
  matchFeedUpdatedAt,
  type Match,
} from '@/app/_data/matches';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/integrations/supabase/env';
import { createServiceSupabaseClient } from '@/integrations/supabase/server';
import type { Database } from '@/integrations/supabase/types';

export const runtime = 'edge';

type SupabaseMatchRow = {
  opponent?: string | null;
  home?: string | null;
  away?: string | null;
  [key: string]: unknown;
};

type MatchesClient = SupabaseClient<Database>;

const resolveMatchesClient = async (): Promise<MatchesClient | null> => {
  const serviceClient = createServiceSupabaseClient();
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabasePublishableKey();
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { createClient } = await import('@supabase/supabase-js');
  return createClient<Database>(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
};

async function fetchMatchesFromSupabase() {
  const client = await resolveMatchesClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.from('matches').select('*').order('date');

  if (error) {
    // Swallow error and allow fallback to fixtures
    console.error('Supabase matches fetch failed:', error.message);
    return null;
  }
  return data ?? null;
}

/**
 * Returns the current match centre feed as JSON.
 *
 * The response includes:
 *  - `matches`: list of Match objects (DB if available, else fixtures)
 *  - `highlights`: highlight clips (fixtures)
 *  - `standings`: current league table (fixtures)
 *  - `updatedAt`: ISO timestamp for last update (fixtures timestamp)
 */
export async function GET() {
  const dbMatches = await fetchMatchesFromSupabase();
  const matches = (dbMatches ?? fixtureMatches).map((match) => {
    const row = match as SupabaseMatchRow | Match;
    if ('opponent' in row && typeof row.opponent === 'string' && row.opponent) return row;
    const home = typeof row.home === 'string' ? row.home : undefined;
    const away = typeof row.away === 'string' ? row.away : undefined;
    const isRayonHome = home?.toLowerCase().includes('rayon');
    const opponent = isRayonHome ? away : home;
    return {
      opponent,
      ...row,
    };
  });

  return NextResponse.json({
    matches,
    highlights: highlightClips,
    standings: leagueTable,
    updatedAt: matchFeedUpdatedAt,
  });
}
