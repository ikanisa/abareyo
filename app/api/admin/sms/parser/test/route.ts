import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { testSmsParser } from '@/services/admin/sms';

// Feature flag to enable/disable this endpoint (disabled by default)
const isParserTestEnabled = () => (process.env.ADMIN_SMS_PARSER_TEST_ENABLED ?? '') === '1';

// Simple per-user rate limiter (in-memory, sliding window)
const WINDOW_MS = Number(process.env.ADMIN_SMS_PARSER_TEST_WINDOW_MS ?? '60000');
const LIMIT = Number(process.env.ADMIN_SMS_PARSER_TEST_RATE_LIMIT ?? '10');
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const computeRate = (key: string) => {
  const now = Date.now();
  const prev = buckets.get(key);
  if (!prev || now >= prev.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, next);
    return { allowed: true, remaining: Math.max(0, LIMIT - next.count), resetAt: next.resetAt } as const;
  }
  if (prev.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: prev.resetAt } as const;
  }
  prev.count += 1;
  return { allowed: true, remaining: Math.max(0, LIMIT - prev.count), resetAt: prev.resetAt } as const;
};

export const POST = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:parser:update' });
  if ('response' in session) {
    return session.response;
  }

  if (!isParserTestEnabled()) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const rate = computeRate(session.context.user.id);
  const rateHeaders = new Headers({
    'X-RateLimit-Limit': String(LIMIT),
    'X-RateLimit-Remaining': String(rate.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rate.resetAt / 1000)),
  });
  if (!rate.allowed) {
    rateHeaders.set('Retry-After', String(Math.max(0, Math.ceil((rate.resetAt - Date.now()) / 1000))));
    return NextResponse.json({ message: 'Rate limit exceeded' }, { status: 429, headers: rateHeaders });
  }

  let body: { text?: string; promptId?: string; promptBody?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json({ message: 'text is required' }, { status: 400 });
  }

  try {
    const result = await testSmsParser({
      text: body.text,
      promptId: body.promptId,
      promptBody: body.promptBody,
    });
    return NextResponse.json({ data: result }, { headers: rateHeaders });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.parser_test_failed', error);
    return NextResponse.json({ message: 'Parser test failed' }, { status: 500 });
  }
};
