import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import {
  type InboundSmsRecord,
  type ManualReviewPayment,
  type ManualReviewSmsRecord,
  type SmsParserPrompt,
  type SmsParserResult,
  type SmsQueueOverview,
  type ManualSmsResolution,
  type SmsQueuePendingJob,
} from '@/types/admin-sms';
import { withAdminServiceClient } from '@/services/admin/service-client';

const LIMIT_MIN = 1;
const LIMIT_MAX = 200;
const DEFAULT_LIMIT = 50;
const ADMIN_RESOLUTION_META_KEY = 'adminResolution';
const PROMPT_TABLE_CANDIDATES = ['SmsParserPrompt', 'sms_parser_prompt', 'sms_parser_prompts'] as const;

type SmsRawRow = {
  id: string;
  text: string;
  from_msisdn?: string | null;
  to_msisdn?: string | null;
  received_at?: string | null;
  ingest_status?: string | null;
  metadata?: Record<string, unknown> | null;
  sms_parsed?:
    | {
        id: string;
        amount?: number | string | null;
        currency?: string | null;
        ref?: string | null;
        confidence?: number | string | null;
        matched_entity?: string | null;
        payer_mask?: string | null;
      }
    | null;
};

type SmsParsedRow = NonNullable<SmsRawRow['sms_parsed']>;

type PaymentRow = {
  id: string;
  amount: number;
  currency: string | null;
  kind: string | null;
  status: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
  order_id: string | null;
  ticket_order_id: string | null;
  membership_id: string | null;
  donation_id: string | null;
  sms_parsed?: SmsParsedRow | null;
};

type PromptRow = {
  id: string;
  label: string;
  body: string;
  version: number | string | null;
  isActive?: boolean | null;
  is_active?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
};

const clampLimit = (value?: number | null, fallback = DEFAULT_LIMIT) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(LIMIT_MIN, Math.min(LIMIT_MAX, value));
};

const parseNumeric = (value: number | string | null | undefined, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const mapParsedSms = (row: SmsParsedRow | null | undefined) => {
  if (!row) return null;
  return {
    id: row.id,
    amount: parseNumeric(row.amount),
    currency: row.currency ?? 'RWF',
    ref: row.ref ?? 'UNKNOWN',
    confidence: parseNumeric(row.confidence, 0),
    matchedEntity: row.matched_entity ?? null,
    payerMask: row.payer_mask ?? undefined,
  };
};

const mapInboundRecord = (row: SmsRawRow): InboundSmsRecord => ({
  id: row.id,
  text: row.text,
  fromMsisdn: row.from_msisdn ?? 'unknown',
  toMsisdn: row.to_msisdn ?? null,
  receivedAt: row.received_at ?? new Date().toISOString(),
  ingestStatus: (row.ingest_status as InboundSmsRecord['ingestStatus']) ?? 'received',
  parsed: mapParsedSms(row.sms_parsed),
});

const mapManualPayment = ({
  row,
  order,
  ticketOrder,
  membership,
  membershipPlan,
  donation,
  donationProject,
}: {
  row: PaymentRow;
  order?: { id: string; status: string | null } | null;
  ticketOrder?: { id: string; status: string | null } | null;
  membership?: { id: string; plan_id: string | null } | null;
  membershipPlan?: { id: string; name: string | null } | null;
  donation?: { id: string; project_id: string | null } | null;
  donationProject?: { id: string; title: string | null } | null;
}): ManualReviewPayment => ({
  id: row.id,
  amount: parseNumeric(row.amount),
  currency: row.currency ?? 'RWF',
  kind: row.kind ?? 'ticket',
  status: row.status ?? 'manual_review',
  createdAt: row.created_at ?? new Date().toISOString(),
  metadata: row.metadata ?? null,
  order: order
    ? { id: order.id, status: order.status ?? null }
    : ticketOrder
      ? { id: ticketOrder.id, status: ticketOrder.status ?? null }
      : null,
  membership: membership
    ? {
        id: membership.id,
        plan: membershipPlan ? { name: membershipPlan.name ?? '' } : null,
      }
    : null,
  donation: donation
    ? {
        id: donation.id,
        project: donationProject ? { title: donationProject.title ?? '' } : null,
      }
    : null,
  smsParsed: mapParsedSms(row.sms_parsed),
});

const toMetadataObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
};

const toNumericCandidate = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return null;
};

const withoutAdminResolution = (metadata: Record<string, unknown>) => {
  if (ADMIN_RESOLUTION_META_KEY in metadata) {
    const next = { ...metadata };
    delete next[ADMIN_RESOLUTION_META_KEY];
    return next;
  }
  return metadata;
};

const mapResolutionToStatus = (resolution: ManualSmsResolution) => {
  if (resolution === 'linked_elsewhere') {
    return 'parsed';
  }
  return 'error';
};

export const fetchInboundSmsRecords = async (limit = DEFAULT_LIMIT): Promise<InboundSmsRecord[]> =>
  withAdminServiceClient(async (client) => {
    const { data, error } = await client
      .from('sms_raw')
      .select(
        'id, text, from_msisdn, to_msisdn, received_at, ingest_status, metadata, sms_parsed(id, amount, currency, ref, confidence, matched_entity, payer_mask)',
      )
      .order('received_at', { ascending: false })
      .limit(clampLimit(limit));

    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return rows.map((row) => mapInboundRecord(row as unknown as SmsRawRow));
  });

export const fetchManualReviewSmsRecords = async (limit = DEFAULT_LIMIT): Promise<ManualReviewSmsRecord[]> =>
  withAdminServiceClient(async (client) => {
    const { data, error } = await client
      .from('sms_raw')
      .select(
        'id, text, from_msisdn, to_msisdn, received_at, ingest_status, metadata, sms_parsed(id, amount, currency, ref, confidence, matched_entity, payer_mask)',
      )
      .eq('ingest_status', 'manual_review')
      .order('received_at', { ascending: false })
      .limit(clampLimit(limit));

    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return rows.map((row) => mapInboundRecord(row as unknown as SmsRawRow));
  });

const buildIdSet = (rows: PaymentRow[], key: keyof PaymentRow) => {
  const ids = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === 'string' && value.length) {
      ids.add(value);
    }
  }
  return Array.from(ids);
};

const fetchMap = async <T extends { id: string }>(
  client: SupabaseClient,
  table: string,
  ids: string[],
  select: string,
) => {
  if (ids.length === 0) {
    return new Map<string, T>();
  }
  const { data, error } = await client.from(table).select(select).in('id', ids);
  if (error) throw error;
  return new Map(((data ?? []) as unknown as T[]).map((item) => [item.id, item]));
};

export const fetchManualReviewPayments = async (limit = DEFAULT_LIMIT): Promise<ManualReviewPayment[]> =>
  withAdminServiceClient(async (client) => {
    const { data, error } = await client
      .from('payments')
      .select(
        'id, amount, currency, kind, status, created_at, metadata, order_id, ticket_order_id, membership_id, donation_id, sms_parsed(id, amount, currency, ref, confidence, matched_entity)',
      )
      .eq('status', 'manual_review')
      .order('created_at', { ascending: false })
      .limit(clampLimit(limit));

    if (error) throw error;
    const rows = (data ?? []) as unknown as PaymentRow[];

    const orderIds = buildIdSet(rows, 'order_id');
    const ticketOrderIds = buildIdSet(rows, 'ticket_order_id');
    const membershipIds = buildIdSet(rows, 'membership_id');
    const donationIds = buildIdSet(rows, 'donation_id');

    const [ordersMap, ticketOrdersMap, membershipsMap, donationsMap] = await Promise.all([
      fetchMap<{ id: string; status: string | null }>(client, 'orders', orderIds, 'id, status'),
      fetchMap<{ id: string; status: string | null }>(client, 'ticket_orders', ticketOrderIds, 'id, status'),
      fetchMap<{ id: string; plan_id: string | null }>(client, 'memberships', membershipIds, 'id, plan_id'),
      fetchMap<{ id: string; project_id: string | null }>(client, 'fund_donations', donationIds, 'id, project_id'),
    ]);

    const membershipPlanIds = Array.from(
      new Set(Array.from(membershipsMap.values()).map((m) => m.plan_id).filter((id): id is string => Boolean(id))),
    );
    const donationProjectIds = Array.from(
      new Set(Array.from(donationsMap.values()).map((d) => d.project_id).filter((id): id is string => Boolean(id))),
    );

    const [plansMap, projectsMap] = await Promise.all([
      fetchMap<{ id: string; name: string | null }>(client, 'membership_plans', membershipPlanIds, 'id, name'),
      fetchMap<{ id: string; title: string | null }>(client, 'fund_projects', donationProjectIds, 'id, title'),
    ]);

    return rows.map((row) =>
      mapManualPayment({
        row,
        order: row.order_id ? ordersMap.get(row.order_id) : undefined,
        ticketOrder: row.ticket_order_id ? ticketOrdersMap.get(row.ticket_order_id) : undefined,
        membership: row.membership_id ? membershipsMap.get(row.membership_id) : undefined,
        membershipPlan:
          row.membership_id && membershipsMap.get(row.membership_id)?.plan_id
            ? plansMap.get(membershipsMap.get(row.membership_id)!.plan_id!)
            : undefined,
        donation: row.donation_id ? donationsMap.get(row.donation_id) : undefined,
        donationProject:
          row.donation_id && donationsMap.get(row.donation_id)?.project_id
            ? projectsMap.get(donationsMap.get(row.donation_id)!.project_id!)
            : undefined,
      }),
    );
  });

export const fetchSmsQueueOverview = async (): Promise<SmsQueueOverview> =>
  withAdminServiceClient(async (client) => {
    const { data, error } = await client
      .from('sms_raw')
      .select('id, received_at, metadata, ingest_status')
      .eq('ingest_status', 'manual_review')
      .order('received_at', { ascending: false })
      .limit(25);

    if (error) throw error;
    const pending: SmsQueuePendingJob[] = (data ?? []).map((raw) => {
      const row = raw as SmsRawRow;
      const meta = toMetadataObject(row.metadata);
      const attempts = parseNumeric(toNumericCandidate(meta.parserAttempts ?? meta.attempts), 0);
      const maxAttempts = parseNumeric(toNumericCandidate(meta.parserMaxAttempts ?? meta.maxAttempts), 3);
      const lastError =
        typeof meta.lastError === 'string'
          ? meta.lastError
          : typeof meta.last_error === 'string'
            ? (meta.last_error as string)
            : null;
      return {
        jobId: row.id,
        smsId: row.id,
        attemptsMade: attempts,
        maxAttempts,
        state: 'manual_review',
        enqueuedAt: row.received_at ?? new Date().toISOString(),
        lastFailedReason: lastError,
      };
    });

    return {
      waiting: pending.length,
      delayed: 0,
      active: 0,
      pending,
    };
  });

const fetchSmsRawById = async (client: SupabaseClient, smsId: string) => {
  const { data, error } = await client
    .from('sms_raw')
    .select('id, ingest_status, metadata')
    .eq('id', smsId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const retryManualSms = async (smsId: string) =>
  withAdminServiceClient(async (client) => {
    const sms = await fetchSmsRawById(client, smsId);
    if (!sms) {
      throw new Error('sms_not_found');
    }
    const metadata = withoutAdminResolution(toMetadataObject((sms as SmsRawRow).metadata));
    const { error } = await client
      .from('sms_raw')
      .update({ ingest_status: 'received', metadata })
      .eq('id', smsId);
    if (error) throw error;
  });

export const dismissManualSms = async ({
  smsId,
  resolution,
  note,
  adminUserId,
}: {
  smsId: string;
  resolution: ManualSmsResolution;
  note?: string;
  adminUserId: string | null;
}) =>
  withAdminServiceClient(async (client) => {
    const sms = await fetchSmsRawById(client, smsId);
    if (!sms) {
      throw new Error('sms_not_found');
    }
    const metadata = toMetadataObject((sms as SmsRawRow).metadata);
    metadata[ADMIN_RESOLUTION_META_KEY] = {
      status: resolution,
      note: note ?? null,
      resolvedBy: adminUserId,
      resolvedAt: new Date().toISOString(),
    };
    const ingestStatus = mapResolutionToStatus(resolution);
    const { error } = await client
      .from('sms_raw')
      .update({ ingest_status: ingestStatus, metadata })
      .eq('id', smsId);
    if (error) throw error;
  });

let cachedPromptTable: string | null = null;

const ensurePromptTable = async (client: SupabaseClient): Promise<string> => {
  if (cachedPromptTable) {
    return cachedPromptTable;
  }
  let lastError: PostgrestError | null = null;
  for (const candidate of PROMPT_TABLE_CANDIDATES) {
    const probe = await client.from(candidate).select('id').limit(1);
    if (!probe.error) {
      cachedPromptTable = candidate;
      return candidate;
    }
    lastError = probe.error;
  }
  throw new Error(lastError?.message ?? 'sms_parser_prompt_table_not_found');
};

const mapPromptRow = (row: PromptRow): SmsParserPrompt => ({
  id: row.id,
  label: row.label,
  body: row.body,
  version: parseNumeric(row.version, 1),
  isActive: Boolean(row.isActive ?? row.is_active ?? false),
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
});

export const fetchSmsParserPrompts = async (): Promise<SmsParserPrompt[]> =>
  withAdminServiceClient(async (client) => {
    const table = await ensurePromptTable(client);
    const { data, error } = await client.from(table).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapPromptRow(row as PromptRow));
  });

export const fetchActiveSmsParserPrompt = async (): Promise<SmsParserPrompt | null> =>
  withAdminServiceClient(async (client) => {
    const table = await ensurePromptTable(client);
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('version', { ascending: false })
      .eq(table === 'SmsParserPrompt' ? 'isActive' : 'is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPromptRow(data as PromptRow) : null;
  });

const selectPromptById = async (client: SupabaseClient, promptId: string) => {
  const table = await ensurePromptTable(client);
  const { data, error } = await client.from(table).select('*').eq('id', promptId).maybeSingle();
  if (error) throw error;
  return data ? mapPromptRow(data as PromptRow) : null;
};

export const createSmsParserPrompt = async ({
  label,
  body,
  version,
  createdById,
}: {
  label: string;
  body: string;
  version?: number;
  createdById?: string | null;
}): Promise<SmsParserPrompt> =>
  withAdminServiceClient(async (client) => {
    const table = await ensurePromptTable(client);
    let resolvedVersion = version;
    if (typeof resolvedVersion !== 'number') {
      const { data, error } = await client.from(table).select('version').order('version', { ascending: false }).limit(1);
      if (error) throw error;
      resolvedVersion = parseNumeric(data?.[0]?.version, 0) + 1;
    }

    const insertPayload =
      table === 'SmsParserPrompt'
        ? {
            label,
            body,
            version: resolvedVersion,
            isActive: false,
            createdById: createdById ?? null,
          }
        : {
            label,
            body,
            version: resolvedVersion,
            is_active: false,
            created_by_id: createdById ?? null,
          };

    const { data, error } = await client.from(table).insert(insertPayload).select('*').single();
    if (error) throw error;
    return mapPromptRow(data as PromptRow);
  });

export const activateSmsParserPrompt = async (promptId: string): Promise<SmsParserPrompt> =>
  withAdminServiceClient(async (client) => {
    const table = await ensurePromptTable(client);
    const toggleColumn = table === 'SmsParserPrompt' ? 'isActive' : 'is_active';

    const prompt = await selectPromptById(client, promptId);
    if (!prompt) {
      throw new Error('prompt_not_found');
    }

    const { error: deactivateError } = await client.from(table).update({ [toggleColumn]: false }).neq('id', promptId);
    if (deactivateError) throw deactivateError;

    const { data, error } = await client
      .from(table)
      .update({ [toggleColumn]: true })
      .eq('id', promptId)
      .select('*')
      .single();
    if (error) throw error;
    return mapPromptRow(data as PromptRow);
  });

const redactForModel = (text: string) =>
  text.replace(/\b(\+?\d[\d\s-]{6,})\b/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length < 6) return match;
    const tail = digits.slice(-3);
    return `***${tail}`;
  });

const buildParserPrompt = (smsText: string, override?: string | null) => {
  const sanitized = redactForModel(smsText);
  if (override && override.trim().length > 0) {
    return `${override.trim()}\n\nSMS:\n"""${sanitized}"""`;
  }
  return `Extract mobile-money payment details from the SMS into strict JSON.
Fields: amount (RWF integer), currency, payer_mask (mask numbers), ref, timestamp (if present), confidence 0..1.
SMS: """${sanitized}"""`;
};

const callOpenAiParser = async (prompt: string, signal?: AbortSignal) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing');
  }

  const schema = {
    type: 'object',
    properties: {
      amount: { type: 'integer' },
      currency: { type: 'string' },
      payer_mask: { type: 'string' },
      ref: { type: 'string' },
      timestamp: { type: 'string' },
      confidence: { type: 'number' },
    },
    required: ['amount', 'currency', 'ref', 'confidence'],
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: prompt,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'sms_parse', schema },
      },
      temperature: 0.2,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`openai_error: ${await response.text()}`);
  }

  const body = (await response.json()) as Record<string, unknown>;
  const output =
    (body?.output as Array<{ content?: Array<{ text?: string }> }> | undefined)?.[0]?.content?.[0]?.text ??
    (body?.output_text as string | undefined) ??
    (body as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content;

  if (!output) {
    return null;
  }

  try {
    const parsed = JSON.parse(output as string) as {
      amount?: number;
      currency?: string;
      payer_mask?: string;
      ref?: string;
      timestamp?: string;
      confidence?: number;
    };
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse OpenAI parser output', error);
    return null;
  }
};

export const testSmsParser = async ({
  text,
  promptId,
  promptBody,
  signal,
}: {
  text: string;
  promptId?: string;
  promptBody?: string;
  signal?: AbortSignal;
}): Promise<SmsParserResult | null> => {
  let resolvedPromptBody = promptBody;
  let parserVersionLabel: string | null = promptId ?? null;
  if (!resolvedPromptBody && promptId) {
    const prompt = await withAdminServiceClient((client) => selectPromptById(client, promptId));
    resolvedPromptBody = prompt?.body;
    parserVersionLabel = prompt?.id ?? parserVersionLabel;
  }
  if (!resolvedPromptBody) {
    const active = await fetchActiveSmsParserPrompt();
    resolvedPromptBody = active?.body;
    if (!parserVersionLabel && active?.id) {
      parserVersionLabel = active.id;
    }
  } else if (!parserVersionLabel && promptBody) {
    parserVersionLabel = 'custom';
  }

  const result = await callOpenAiParser(buildParserPrompt(text, resolvedPromptBody), signal);
  if (!result) {
    return null;
  }
  return {
    amount: parseNumeric(result.amount),
    currency: result.currency ?? 'RWF',
    payerMask: result.payer_mask ?? undefined,
    ref: result.ref ?? 'UNKNOWN',
    timestamp: result.timestamp ?? undefined,
    confidence: parseNumeric(result.confidence, 0),
    parserVersion: parserVersionLabel ?? 'default',
  };
};
