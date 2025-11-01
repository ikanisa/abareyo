import { NextRequest, NextResponse } from 'next/server';

import { getSupabase } from '@/app/_lib/supabase';
import { isSupabaseClient } from '@/app/api/_lib/supabase';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DEFAULT_FALLBACK = { clubs: [] as unknown[] };

const parseLimit = (value: string | null) => {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('limit must be a positive integer');
  }

  return Math.min(parsed, MAX_LIMIT);
};

const parseOffset = (value: string | null) => {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error('offset must be a non-negative integer');
  }

  return parsed;
};

const parseBoolean = (value: string | null) => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  throw new Error('is_official must be a boolean value');
};

const escapeIlike = (term: string) => term.replace(/[%_]/g, (match) => `\\${match}`);

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!isSupabaseClient(supabase)) {
    return NextResponse.json(DEFAULT_FALLBACK);
  }

  const searchParams = request.nextUrl.searchParams;

  let limit: number;
  let offset: number;
  let isOfficialFilter: boolean | null = null;

  try {
    limit = parseLimit(searchParams.get('limit'));
    offset = parseOffset(searchParams.get('offset'));
    isOfficialFilter = parseBoolean(searchParams.get('is_official'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid query parameter';
    return NextResponse.json({ error: 'invalid_query', message }, { status: 400 });
  }

  const searchTerm = (searchParams.get('search') ?? searchParams.get('q') ?? '').trim();
  const regionFilter = (searchParams.get('region') ?? '').trim();

  let query = supabase.from('public_clubs').select('*');

  if (searchTerm) {
    const escaped = escapeIlike(searchTerm);
    const like = `%${escaped}%`;
    query = query.or(`name.ilike.${like},bio.ilike.${like}`);
  }

  if (regionFilter) {
    query = query.eq('region', regionFilter);
  }

  if (isOfficialFilter !== null) {
    query = query.eq('is_official', isOfficialFilter);
  }

  query = query.order('name', { ascending: true });

  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;

  const { data, error } = await query.range(rangeStart, rangeEnd);

  if (error) {
    return NextResponse.json(
      {
        error: 'failed_to_fetch_clubs',
        message: 'Unable to load fan club listings at this time.',
        details: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    clubs: data ?? [],
    meta: {
      limit,
      offset,
      returned: data?.length ?? 0,
      search: searchTerm || null,
      region: regionFilter || null,
      is_official: isOfficialFilter,
    },
  });
}

