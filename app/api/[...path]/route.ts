import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { OnboardingMessageDto, OnboardingSessionDto } from '@rayon/contracts/onboarding';

const BACKEND_BASE = (process.env.BACKEND_BASE_URL || '').replace(/\/$/, '');

type MockContext = { params: { path?: string[] } };

type FanSession = {
  user: {
    id: string;
    status: string;
    locale: string;
    whatsappNumber?: string | null;
    momoNumber?: string | null;
  };
  session: {
    id: string;
    expiresAt: string | null;
  };
  onboardingStatus: string;
};

type MockOnboardingSession = OnboardingSessionDto & {
  locale: string;
  profile: {
    whatsappNumber?: string;
    momoNumber?: string;
  };
};

const onboardingSessions = new Map<string, MockOnboardingSession>();
let activeFanSession: FanSession | null = null;

const paginatedSkeleton = {
  page: 1,
  pageSize: 50,
  total: 0,
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

const isoNow = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();

function publicSession(session: MockOnboardingSession): OnboardingSessionDto {
  const { locale: _locale, profile: _profile, ...rest } = session;
  return rest;
}

function createOnboardingSession(locale?: string): MockOnboardingSession {
  const createdAt = isoNow();
  const session: MockOnboardingSession = {
    id: randomUUID(),
    userId: 'fan-demo',
    status: 'collecting_profile',
    createdAt,
    updatedAt: createdAt,
    messages: [
      {
        id: randomUUID(),
        role: 'assistant',
        kind: 'text',
        text: 'Muraho neza! Turimo kugufasha kwinjira mu Rayon fan club. Ohereza nimero ya WhatsApp na ya MoMo ukoresha gushyigikira ikipe.',
        createdAt,
      },
    ],
    locale: typeof locale === 'string' && locale.trim() ? locale : 'rw',
    profile: {},
  };
  onboardingSessions.set(session.id, session);
  return session;
}

function normalizeNumber(raw: string, fallback: string) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return fallback;
  if (digits.startsWith('0') && digits.length >= 9) {
    return `+250${digits.slice(1).padStart(9, '0')}`;
  }
  if (digits.startsWith('250')) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+250${digits}`;
  }
  return fallback;
}

function deriveNumberPair(text: string) {
  const matches = text.match(/\d[\d\s+()-]{5,}/g) ?? [];
  const whatsapp = normalizeNumber(matches[0] ?? '', '+250780000000');
  const momo = normalizeNumber(matches[1] ?? matches[0] ?? '', '+250780000001');
  return { whatsapp, momo };
}

function ensureFanSessionFromOnboarding(session: MockOnboardingSession): FanSession {
  const expiresAt = isoNow(1000 * 60 * 60 * 24);
  const whatsappNumber = session.profile.whatsappNumber ?? '+250780000000';
  const momoNumber = session.profile.momoNumber ?? '+250780000001';
  activeFanSession = {
    user: {
      id: session.userId,
      status: 'active',
      locale: session.locale,
      whatsappNumber,
      momoNumber,
    },
    session: {
      id: randomUUID(),
      expiresAt,
    },
    onboardingStatus: session.status,
  };
  return activeFanSession;
}

async function mockResponse(req: NextRequest, ctx: MockContext) {
  const segments = ctx.params.path ?? [];
  const path = segments.join('/');
  const method = req.method.toUpperCase();

  if (segments[0] === 'auth' && segments[1] === 'fan') {
    if (method === 'GET' && segments[2] === 'me') {
      if (!activeFanSession) {
        return new Response('Unauthenticated', { status: 401 });
      }
      return json({ data: activeFanSession });
    }

    if (method === 'POST' && segments[2] === 'from-onboarding') {
      const payload = (await req.json().catch(() => ({}))) as { sessionId?: string };
      const sessionId = payload?.sessionId;
      if (!sessionId) {
        return new Response('sessionId is required', { status: 400 });
      }

      const session = onboardingSessions.get(sessionId);
      if (!session || session.status !== 'completed') {
        return new Response('Onboarding session not ready', { status: 400 });
      }

      const fanSession = ensureFanSessionFromOnboarding(session);
      return json({ data: fanSession });
    }

    if (method === 'POST' && segments[2] === 'logout') {
      activeFanSession = null;
      return json({ data: { status: 'signed_out' } });
    }
  }

  if (segments[0] === 'onboarding' && segments[1] === 'sessions') {
    if (method === 'POST' && segments.length === 2) {
      const body = (await req.json().catch(() => ({}))) as { locale?: string };
      const session = createOnboardingSession(body?.locale);
      return json({ data: publicSession(session) });
    }

    const sessionId = segments[2];
    if (!sessionId) {
      return new Response('Session not found', { status: 404 });
    }

    const session = onboardingSessions.get(sessionId);
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    if (method === 'GET' && segments.length === 3) {
      return json({ data: publicSession(session) });
    }

    if (method === 'POST' && segments[3] === 'messages') {
      const body = (await req.json().catch(() => ({}))) as { message?: string };
      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      const baseTime = Date.now();

      const userMessage: OnboardingMessageDto = {
        id: randomUUID(),
        role: 'user',
        kind: 'text',
        text: message || 'Ndiko gukomeza onboarding',
        createdAt: new Date(baseTime).toISOString(),
      };

      session.messages = [...session.messages, userMessage];

      const { whatsapp, momo } = deriveNumberPair(message);
      session.profile.whatsappNumber = whatsapp;
      session.profile.momoNumber = momo;
      session.status = 'completed';

      const toolResult: OnboardingMessageDto = {
        id: randomUUID(),
        role: 'tool',
        kind: 'tool_result',
        payload: {
          whatsappNumber: whatsapp,
          momoNumber: momo,
        },
        createdAt: new Date(baseTime + 200).toISOString(),
      };

      const assistantReply: OnboardingMessageDto = {
        id: randomUUID(),
        role: 'assistant',
        kind: 'text',
        text: `Byiza cyane! Tuzakomeza kukumenyesha kuri WhatsApp ${whatsapp} kandi ukoreshe MoMo ${momo} gushyigikira ikipe. Uri kumwe natwe!`,
        createdAt: new Date(baseTime + 400).toISOString(),
      };

      session.messages = [...session.messages, toolResult, assistantReply];
      session.updatedAt = assistantReply.createdAt;
      onboardingSessions.set(session.id, session);

      return json({ data: publicSession(session) });
    }
  }

  // Sample data used across responses
  const sampleProject = {
    id: 'demo-project',
    title: 'Stadium Upgrade Fund',
    description: 'Help Rayon Sports renovate the home stands.',
    goal: 50000000,
    progress: 12500000,
    status: 'active',
    coverImage: null,
    coverImageUrl: null,
  };

  const sampleMatch = {
    id: 'match-demo',
    opponent: 'APR FC',
    kickoff: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    venue: 'Kigali Stadium',
    competition: 'Rwanda Premier League',
    status: 'scheduled',
    score: null,
  };

  switch (method) {
    case 'GET': {
      if (path === 'fundraising/projects') {
        return json({ data: [sampleProject] });
      }

      if (path === 'tickets/catalog') {
        return json({
          data: [
            {
              ...sampleMatch,
              zones: [
                { zone: 'VIP', price: 15000, capacity: 500, remaining: 420, gate: 'A' },
                { zone: 'REGULAR', price: 5000, capacity: 4000, remaining: 3510, gate: 'C' },
              ],
            },
          ],
        });
      }

      if (path === 'matches/summaries') {
        return json({ data: [sampleMatch] });
      }

      if (path === 'tickets/analytics') {
        return json({
          data: {
            totals: {
              revenue: 12500000,
              orders: 420,
              paid: 320,
              pending: 80,
              cancelled: 20,
              expired: 0,
              averageOrderValue: 29762,
            },
            matchBreakdown: [],
            recentSales: [],
            paymentStatus: [],
          },
        });
      }

      if (path === 'tickets/gate/history') {
        return json({ data: [] });
      }

      if (path === 'fundraising/donations') {
        return json({ data: [], meta: paginatedSkeleton });
      }

      if (path.startsWith('admin/')) {
        return json({ data: [], meta: paginatedSkeleton });
      }

      if (segments[0] === 'health') {
        return json({ status: 'ok', source: 'mock' });
      }

      return json({ data: [] });
    }

    case 'POST': {
      if (path === 'fundraising/donate') {
        const payload = await req.json().catch(() => ({}));
        return json({
          data: {
            donationId: 'demo-donation',
            paymentId: 'demo-payment',
            amount: payload?.amount ?? 10000,
            ussdCode: '*182*8*1#',
            expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            project: sampleProject,
          },
        });
      }

      if (path === 'tickets/checkout') {
        return json({
          data: {
            orderId: 'order-demo',
            total: 10000,
            ussdCode: '*182*8*1#',
            expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            paymentId: 'payment-demo',
          },
        });
      }

      if (path === 'tickets/verify-pass') {
        return json({
          data: { status: 'verified', passId: 'pass-demo', orderId: 'order-demo', zone: 'VIP' },
        });
      }

      if (path === 'tickets/passes/initiate-transfer') {
        return json({
          data: { transferCode: '123456', passId: 'pass-demo', targetUserId: null },
        });
      }

      if (path === 'tickets/passes/claim-transfer') {
        return json({ data: { passId: 'pass-demo', recipientUserId: 'user-demo' } });
      }

      if (path === 'wallet/transactions') {
        return json({ data: { acknowledged: true } });
      }

      return json({ data: { ok: true } });
    }

    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return json({ data: { ok: true } });

    default:
      return new Response('Method not supported in mock backend.', { status: 405 });
  }
}

async function onboardingGateway(req: NextRequest, ctx: MockContext) {
  const segments = ctx.params.path ?? [];
  const method = req.method.toUpperCase();
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const validA = process.env.ONBOARDING_API_TOKEN || '';
  const validB = process.env.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN || '';

  // /api/onboarding/sessions
  if (segments[1] === 'sessions' && segments.length === 2) {
    if (method !== 'POST') {
      return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
    }
    if (!bearer || (bearer !== validA && bearer !== validB)) {
      return NextResponse.json({ error: 'unauthorized', message: 'Missing or invalid token.' }, { status: 401 });
    }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const AGENT_ID = process.env.AGENT_ID || 'abareyo-onboarding';
    const ALLOW_MOCK = (
      process.env.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK === '1' ||
      process.env.ONBOARDING_ALLOW_MOCK === '1'
    );
    if (!OPENAI_API_KEY || !AGENT_ID) {
      if (ALLOW_MOCK) {
        const session = { sessionId: randomUUID(), agentId: AGENT_ID, createdAt: new Date().toISOString(), mock: true } as const;
        const res = NextResponse.json({ ok: true, session }, { status: 200 });
        res.headers.set('x-onboarding-mock', '1');
        return res;
      }
      return NextResponse.json({
        error: 'service_unavailable',
        message: 'Onboarding service is not ready. Missing OPENAI_API_KEY or AGENT_ID in production.'
      }, { status: 503 });
    }
    const session = { sessionId: randomUUID(), agentId: AGENT_ID, createdAt: new Date().toISOString() };
    return NextResponse.json({ ok: true, session });
  }

  // /api/onboarding/message
  if (segments[1] === 'message' && segments.length === 2) {
    if (method !== 'POST') {
      return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
    }
    if (!bearer || (bearer !== validA && bearer !== validB)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const AGENT_ID = process.env.AGENT_ID || 'abareyo-onboarding';
    const ALLOW_MOCK = (
      process.env.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK === '1' ||
      process.env.ONBOARDING_ALLOW_MOCK === '1'
    );
    if (ALLOW_MOCK) {
      const res = NextResponse.json({ ok: true, reply: "(mock) Hello! Let’s get your fan profile set up." }, { status: 200 });
      res.headers.set('x-onboarding-mock', '1');
      return res;
    }
    if (!OPENAI_API_KEY || !AGENT_ID) {
      return NextResponse.json({ error: 'service_unavailable', message: 'Agent not configured' }, { status: 503 });
    }
    const body = await req.json().catch(() => ({}) as any);
    const { sessionId, text } = body || {};
    if (!sessionId || !text) {
      return NextResponse.json({ error: 'bad_request', message: 'sessionId and text are required' }, { status: 400 });
    }
    try {
      const resp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: `Agent:${AGENT_ID}\nUser:${text}\nReturn a short onboarding reply.`,
          metadata: { app: 'abareyo', sessionId },
        }),
      });
      if (!resp.ok) {
        const detail = await resp.text();
        return NextResponse.json({ error: 'upstream_error', detail }, { status: 502 });
      }
      const data = await resp.json();
      const reply = data?.output?.[0]?.content?.[0]?.text ?? "Muraho! Let's get started.";
      return NextResponse.json({ ok: true, reply });
    } catch (e: any) {
      return NextResponse.json({ error: 'internal_error', message: e?.message ?? 'Unknown error' }, { status: 500 });
    }
  }

  return null;
}

async function proxy(req: NextRequest, ctx: MockContext) {
  if (!BACKEND_BASE) {
    // Special-case onboarding endpoints with explicit statuses and bearer token
    if ((ctx.params.path?.[0] || '') === 'onboarding') {
      const gw = await onboardingGateway(req, ctx);
      if (gw) return gw;
    }
    return mockResponse(req, ctx);
  }

  const segments = (ctx.params.path || []).join('/');
  const url = new URL(req.url);
  const target = `${BACKEND_BASE}/api/${segments}${url.search}`;

  const init: RequestInit = {
    method: req.method,
    // Pass through headers except host
    headers: new Headers(
      Array.from(req.headers.entries()).filter(([k]) => k.toLowerCase() !== 'host')
    ),
    // Only include body for non-GET/HEAD
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    redirect: 'manual',
  };

  try {
    const resp = await fetch(target, init);
    const headers = new Headers(resp.headers);
    // Remove hop-by-hop headers that can cause issues
    headers.delete('transfer-encoding');
    headers.delete('content-encoding');
    headers.delete('content-length');
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return new Response(`Upstream error: ${message}`, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
