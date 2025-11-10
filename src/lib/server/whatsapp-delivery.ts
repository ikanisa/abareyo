import type { Database, Json } from '@rayon/api/types/database';

import { tryGetSupabaseServiceRoleClient } from '@/lib/db';

export type WhatsappDeliveryStatus = {
  messageId: string;
  status: string;
  phone: string | null;
  conversationId: string | null;
  eventTimestamp: string | null;
  payload: Json;
};

type WhatsappDeliveryTable = Database['public']['Tables']['whatsapp_delivery_events'];
type WhatsappDeliveryInsert = WhatsappDeliveryTable['Insert'];

type StatusRecord = Record<string, unknown>;

type ChangeRecord = {
  value?: {
    statuses?: unknown;
  };
};

type EntryRecord = {
  changes?: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTimestamp = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      const milliseconds = trimmed.length >= 13 ? numeric : numeric * 1000;
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
};

const clonePayload = (value: unknown): Json => {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Json;
  } catch (error) {
    console.warn('[whatsapp] Unable to serialise status payload', error);
    return null;
  }
};

const extractStatus = (candidate: unknown): WhatsappDeliveryStatus | null => {
  if (!isObject(candidate)) {
    return null;
  }

  const messageId = normalizeString(candidate.id);
  const status = normalizeString(candidate.status);

  if (!messageId || !status) {
    return null;
  }

  const phone = normalizeString(candidate.recipient_id ?? candidate.phone);
  const conversationId = normalizeString((candidate.conversation as StatusRecord | undefined)?.id);
  const eventTimestamp = normalizeTimestamp(candidate.timestamp);

  return {
    messageId,
    status,
    phone,
    conversationId,
    eventTimestamp,
    payload: clonePayload(candidate),
  } satisfies WhatsappDeliveryStatus;
};

export const deriveStatusesFromWebhook = (payload: unknown): WhatsappDeliveryStatus[] => {
  if (!isObject(payload)) {
    return [];
  }

  const entries = Array.isArray(payload.entry) ? (payload.entry as unknown[]) : [];
  const results: WhatsappDeliveryStatus[] = [];

  for (const entry of entries) {
    if (!isObject(entry)) {
      continue;
    }

    const changes = Array.isArray((entry as EntryRecord).changes)
      ? (entry as EntryRecord).changes
      : [];

    for (const change of changes as ChangeRecord[]) {
      if (!isObject(change) || !isObject(change.value)) {
        continue;
      }

      const statuses = Array.isArray(change.value.statuses) ? change.value.statuses : [];
      for (const status of statuses) {
        const parsed = extractStatus(status);
        if (parsed) {
          results.push(parsed);
        }
      }
    }
  }

  return results;
};

export const persistWhatsappStatuses = async (statuses: WhatsappDeliveryStatus[]): Promise<number> => {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return 0;
  }

  const client = tryGetSupabaseServiceRoleClient();

  if (!client) {
    console.warn('[whatsapp] Supabase service role client unavailable. Skipping delivery persistence.');
    return 0;
  }

  const rows: WhatsappDeliveryInsert[] = statuses.map((status) => ({
    message_id: status.messageId,
    status: status.status,
    phone: status.phone,
    conversation_id: status.conversationId,
    event_timestamp: status.eventTimestamp,
    payload: status.payload,
  }));

  const { error, data } = await client
    .from('whatsapp_delivery_events')
    .upsert(rows, { onConflict: 'message_id,status' })
    .select('id');

  if (error) {
    throw new Error(`Failed to persist WhatsApp delivery statuses: ${error.message}`);
  }

  return Array.isArray(data) ? data.length : 0;
};

export const __internal = {
  normalizeTimestamp,
  normalizeString,
};
