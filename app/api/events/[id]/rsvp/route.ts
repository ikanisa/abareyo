import { NextRequest, NextResponse } from 'next/server';

import {
  ServiceSupabaseClientUnavailableError,
  getServiceSupabaseClient,
} from '@/app/api/_lib/supabase';

const RSVP_TABLE = 'event_rsvps';
const DEFAULT_STATUS = 'going';
const ALLOWED_STATUSES = new Set(['going', 'interested', 'waitlist', 'cancelled']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RsvpPayload = {
  member_id?: string;
  user_id?: string;
  status?: string;
  note?: string;
  party_size?: number;
  metadata?: Record<string, unknown> | null;
};

const parseUuid = (value: string | null, field: string) => {
  if (!value) {
    throw new Error(`${field} is required`);
  }

  if (!UUID_REGEX.test(value)) {
    throw new Error(`${field} must be a valid UUID`);
  }

  return value;
};

const parseStatus = (value: string | undefined) => {
  if (!value) {
    return DEFAULT_STATUS;
  }

  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_STATUSES.has(normalized)) {
    throw new Error('status must be one of going, interested, waitlist, or cancelled');
  }

  return normalized;
};

const parsePartySize = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('party_size must be a positive integer');
  }

  return parsed;
};

const parseMetadata = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('metadata must be an object');
  }

  return value as Record<string, unknown>;
};

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const eventIdParam = context.params?.id ?? '';

  try {
    parseUuid(eventIdParam, 'event_id');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid event id';
    return NextResponse.json({ error: 'invalid_event_id', message }, { status: 400 });
  }

  let body: RsvpPayload;
  try {
    body = (await request.json()) as RsvpPayload;
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const memberIdCandidate = body.member_id?.trim() || body.user_id?.trim() || null;
  let memberId: string;

  try {
    memberId = parseUuid(memberIdCandidate, 'member_id');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid member_id';
    return NextResponse.json({ error: 'invalid_member_id', message }, { status: 400 });
  }

  let status: string;
  try {
    status = parseStatus(body.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid status value';
    return NextResponse.json({ error: 'invalid_status', message }, { status: 400 });
  }

  let partySize: number | null = null;
  try {
    partySize = parsePartySize(body.party_size);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid party_size';
    return NextResponse.json({ error: 'invalid_party_size', message }, { status: 400 });
  }

  let metadata: Record<string, unknown> | null = null;
  try {
    metadata = parseMetadata(body.metadata ?? null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid metadata';
    return NextResponse.json({ error: 'invalid_metadata', message }, { status: 400 });
  }

  let supabase: ReturnType<typeof getServiceSupabaseClient>;
  try {
    supabase = getServiceSupabaseClient();
  } catch (error) {
    if (error instanceof ServiceSupabaseClientUnavailableError) {
      return NextResponse.json(
        {
          error: 'service_unavailable',
          message: 'The RSVP service is not configured. Please try again later.',
        },
        { status: 503 },
      );
    }
    throw error;
  }

  const upsertPayload: Record<string, unknown> = {
    event_id: eventIdParam,
    member_id: memberId,
    status,
    note: typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : null,
    party_size: partySize,
    metadata,
  };

  const { data, error } = await supabase
    .from(RSVP_TABLE)
    .upsert(upsertPayload, { onConflict: 'event_id,member_id' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: 'rsvp_failed',
        message: 'Unable to record your RSVP. Please try again later.',
        details: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ rsvp: data }, { status: 201 });
}

