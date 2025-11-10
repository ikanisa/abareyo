import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deriveStatusesFromWebhook,
  persistWhatsappStatuses,
  type WhatsappDeliveryStatus,
} from '@/lib/server/whatsapp-delivery';

const tryGetClientMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db', () => ({
  tryGetSupabaseServiceRoleClient: tryGetClientMock,
}));

describe('deriveStatusesFromWebhook', () => {
  it('extracts delivery status records from webhook payload', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: 'wamid.ABC',
                    status: 'delivered',
                    recipient_id: '+250788123456',
                    timestamp: '1700000000',
                    conversation: { id: 'conv-123' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = deriveStatusesFromWebhook(payload);
    expect(result).toHaveLength(1);
    const status = result[0];
    expect(status).toBeDefined();
    if (!status) {
      throw new Error('Expected a derived status record');
    }
    expect(status).toMatchObject({
      messageId: 'wamid.ABC',
      status: 'delivered',
      phone: '+250788123456',
      conversationId: 'conv-123',
    });
    expect(status.eventTimestamp).toMatch(/^20\d{2}-/);
    expect(status.payload).toBeTruthy();
  });

  it('returns an empty array for unrecognised payloads', () => {
    expect(deriveStatusesFromWebhook(null)).toEqual([]);
    expect(deriveStatusesFromWebhook({})).toEqual([]);
    expect(deriveStatusesFromWebhook({ entry: [{ changes: [{ value: { statuses: [{}] } }] }] })).toEqual([]);
  });
});

describe('persistWhatsappStatuses', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  afterEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  beforeEach(() => {
    tryGetClientMock.mockReset();
  });

  const sampleStatuses: WhatsappDeliveryStatus[] = [
    {
      messageId: 'wamid.ABC',
      status: 'read',
      phone: '+250788123456',
      conversationId: 'conv-123',
      eventTimestamp: '2024-10-10T12:00:00.000Z',
      payload: { foo: 'bar' },
    },
  ];

  it('returns 0 when no statuses are provided', async () => {
    const count = await persistWhatsappStatuses([]);
    expect(count).toBe(0);
    expect(tryGetClientMock).not.toHaveBeenCalled();
  });

  it('skips persistence when Supabase client is unavailable', async () => {
    tryGetClientMock.mockReturnValue(null);
    const count = await persistWhatsappStatuses(sampleStatuses);
    expect(count).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('upserts records when Supabase client is available', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const upsertMock = vi.fn(() => ({ select: selectMock }));
    const fromMock = vi.fn(() => ({ upsert: upsertMock }));

    tryGetClientMock.mockReturnValue({ from: fromMock });

    const count = await persistWhatsappStatuses(sampleStatuses);
    expect(count).toBe(1);
    expect(fromMock).toHaveBeenCalledWith('whatsapp_delivery_events');
    expect(upsertMock).toHaveBeenCalled();
    expect(selectMock).toHaveBeenCalledWith('id');
  });

  it('throws when Supabase reports an error', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const upsertMock = vi.fn(() => ({ select: selectMock }));
    const fromMock = vi.fn(() => ({ upsert: upsertMock }));
    tryGetClientMock.mockReturnValue({ from: fromMock });

    await expect(persistWhatsappStatuses(sampleStatuses)).rejects.toThrow(/Failed to persist/);
  });
});
