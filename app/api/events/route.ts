import { NextRequest, NextResponse } from 'next/server';

import { getSupabase } from '@/app/_lib/supabase';
import { isSupabaseClient } from '@/app/api/_lib/supabase';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_FETCH = 500;

type EventRecord = Record<string, unknown>;
type SupabaseClientInstance = Exclude<ReturnType<typeof getSupabase>, null>;

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

const parseIsoDate = (value: string | null, field: string) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${field} must be a valid ISO-8601 timestamp`);
  }

  return new Date(timestamp);
};

const parseBoolean = (value: string | null, field: string) => {
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

  throw new Error(`${field} must be a boolean value`);
};

const coerceString = (value: unknown) => (typeof value === 'string' ? value : '');

const getEventDate = (event: EventRecord) => {
  const dateCandidates = [
    event.start_at,
    event.starts_at,
    event.start_time,
    event.start,
    event.date,
  ].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);

  if (dateCandidates.length === 0) {
    return null;
  }

  const timestamp = Date.parse(dateCandidates[0]);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp);
};

const matchesSearch = (event: EventRecord, term: string) => {
  const normalized = term.toLowerCase();
  const fields = [
    coerceString(event.title),
    coerceString(event.name),
    coerceString(event.description),
    coerceString(event.summary),
    coerceString(event.location),
    coerceString(event.venue),
    coerceString(event.city),
    coerceString(event.region),
  ];

  return fields.some((field) => field.toLowerCase().includes(normalized));
};

const pickFirstString = (event: EventRecord, keys: string[]) => {
  for (const key of keys) {
    const value = event[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
};

const tryFetchEvents = async (orderKeys: string[], supabase: SupabaseClientInstance) => {
  let lastError: Error | null = null;

  for (const key of orderKeys) {
    const query = supabase
      .from('public_events')
      .select('*')
      .order(key as never, { ascending: true })
      .limit(MAX_FETCH);

    const { data, error } = await query;

    if (!error) {
      return { data: data ?? [], error: null };
    }

    lastError = error;
    if (!error.message.includes('column')) {
      break;
    }
  }

  return { data: [] as EventRecord[], error: lastError };
};

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!isSupabaseClient(supabase)) {
    return NextResponse.json({ events: [], meta: { limit: DEFAULT_LIMIT, offset: 0, returned: 0 } });
  }

  const params = request.nextUrl.searchParams;

  let limit: number;
  let offset: number;
  let startsAfter: Date | null = null;
  let startsBefore: Date | null = null;
  let featuredFilter: boolean | null = null;

  try {
    limit = parseLimit(params.get('limit'));
    offset = parseOffset(params.get('offset'));
    startsAfter = parseIsoDate(params.get('starts_after') ?? params.get('after'), 'starts_after');
    startsBefore = parseIsoDate(params.get('starts_before') ?? params.get('before'), 'starts_before');
    featuredFilter = parseBoolean(params.get('is_featured'), 'is_featured');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid query parameter';
    return NextResponse.json({ error: 'invalid_query', message }, { status: 400 });
  }

  const searchTerm = (params.get('search') ?? params.get('q') ?? '').trim().toLowerCase();
  const statusFilter = (params.get('status') ?? params.get('state') ?? '').trim().toLowerCase();
  const clubFilter = (params.get('club_id') ?? params.get('fan_club_id') ?? '').trim();
  const regionFilter = (params.get('region') ?? '').trim().toLowerCase();
  const cityFilter = (params.get('city') ?? '').trim().toLowerCase();
  const categoryFilter = (params.get('category') ?? params.get('kind') ?? params.get('type') ?? '').trim().toLowerCase();

  const orderColumns = ['start_at', 'starts_at', 'start_time', 'date', 'created_at'];
  const { data: rawEvents, error } = await tryFetchEvents(orderColumns, supabase);

  if (error) {
    return NextResponse.json(
      {
        error: 'failed_to_fetch_events',
        message: 'Unable to load club events at this time.',
        details: error.message,
      },
      { status: 500 },
    );
  }

  const filtered = rawEvents
    .filter((event) => {
      if (searchTerm) {
        if (!matchesSearch(event, searchTerm)) {
          return false;
        }
      }

      if (statusFilter) {
        const status = pickFirstString(event, ['status', 'state', 'event_status']);
        if (!status || status.toLowerCase() !== statusFilter) {
          return false;
        }
      }

      if (clubFilter) {
        const clubId = pickFirstString(event, ['club_id', 'fan_club_id', 'organizer_id']);
        if (!clubId || clubId !== clubFilter) {
          return false;
        }
      }

      if (regionFilter) {
        const region = pickFirstString(event, ['region']);
        if (!region || region.toLowerCase() !== regionFilter) {
          return false;
        }
      }

      if (cityFilter) {
        const city = pickFirstString(event, ['city', 'venue_city']);
        if (!city || city.toLowerCase() !== cityFilter) {
          return false;
        }
      }

      if (categoryFilter) {
        const category = pickFirstString(event, ['category', 'kind', 'type']);
        if (!category || category.toLowerCase() !== categoryFilter) {
          return false;
        }
      }

      if (featuredFilter !== null) {
        const rawValue = event.is_featured ?? event.featured ?? null;
        const boolValue =
          typeof rawValue === 'boolean'
            ? rawValue
            : typeof rawValue === 'string'
            ? ['true', '1', 'yes'].includes(rawValue.trim().toLowerCase())
            : null;

        if (boolValue === null || boolValue !== featuredFilter) {
          return false;
        }
      }

      const eventDate = getEventDate(event);
      if (startsAfter) {
        if (!eventDate || eventDate < startsAfter) {
          return false;
        }
      }
      if (startsBefore) {
        if (!eventDate || eventDate > startsBefore) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = getEventDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = getEventDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

  const sliced = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    events: sliced,
    meta: {
      limit,
      offset,
      returned: sliced.length,
      total: filtered.length,
      search: searchTerm || null,
      status: statusFilter || null,
      club_id: clubFilter || null,
      region: regionFilter || null,
      city: cityFilter || null,
      category: categoryFilter || null,
      is_featured: featuredFilter,
      starts_after: startsAfter?.toISOString() ?? null,
      starts_before: startsBefore?.toISOString() ?? null,
    },
  });
}

