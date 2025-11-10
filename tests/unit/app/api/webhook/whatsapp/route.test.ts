import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/webhook/whatsapp/route';

const telemetryMock = vi.hoisted(() => vi.fn());
const deriveMock = vi.hoisted(() => vi.fn());
const persistMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/observability/node-observability', () => ({
  setupNodeObservability: vi.fn(),
}));

vi.mock('@/lib/observability', async () => {
  const actual = await vi.importActual<typeof import('@/lib/observability')>('@/lib/observability');
  return {
    ...actual,
    dispatchTelemetryEvent: telemetryMock,
  };
});

vi.mock('@/lib/server/whatsapp-delivery', () => ({
  deriveStatusesFromWebhook: deriveMock,
  persistWhatsappStatuses: persistMock,
}));

const buildRequest = (url: string, init?: RequestInit) =>
  new NextRequest(url, { method: init?.method, headers: init?.headers, body: init?.body as BodyInit | null | undefined });

describe('/api/webhook/whatsapp', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'secret-token';
    delete process.env.WHATSAPP_APP_SECRET;
    telemetryMock.mockClear();
    deriveMock.mockReset();
    persistMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('completes webhook verification handshake when token matches', async () => {
    const request = buildRequest(
      'https://example.com/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=secret-token&hub.challenge=1234',
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('1234');
  });

  it('rejects handshake when token mismatches', async () => {
    const request = buildRequest(
      'https://example.com/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=other&hub.challenge=4321',
    );

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it('rejects invalid JSON payloads', async () => {
    const request = buildRequest('https://example.com/api/webhook/whatsapp', {
      method: 'POST',
      body: '{bad json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('persists delivery statuses when provided', async () => {
    const statuses = [
      {
        messageId: 'wamid.ABC',
        status: 'delivered',
        phone: null,
        conversationId: null,
        eventTimestamp: null,
        payload: null,
      },
    ];
    deriveMock.mockReturnValue(statuses);
    persistMock.mockResolvedValue(statuses.length);

    const request = buildRequest('https://example.com/api/webhook/whatsapp', {
      method: 'POST',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify({ entry: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(202);
    expect(deriveMock).toHaveBeenCalledWith({ entry: [] });
    expect(persistMock).toHaveBeenCalledWith(statuses);
    const body = (await response.json()) as { status: string; persisted: number };
    expect(body.persisted).toBe(statuses.length);
  });

  it('acknowledges payload even if persistence fails', async () => {
    deriveMock.mockReturnValue([
      {
        messageId: 'wamid.ABC',
        status: 'delivered',
        phone: null,
        conversationId: null,
        eventTimestamp: null,
        payload: null,
      },
    ]);
    persistMock.mockRejectedValue(new Error('boom'));

    const response = await POST(
      buildRequest('https://example.com/api/webhook/whatsapp', {
        method: 'POST',
        headers: new Headers({ 'content-type': 'application/json' }),
        body: JSON.stringify({ entry: [] }),
      }),
    );

    expect(response.status).toBe(202);
    expect(persistMock).toHaveBeenCalled();
  });
});
