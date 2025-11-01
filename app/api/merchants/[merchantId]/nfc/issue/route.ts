import { NextRequest } from 'next/server';

import { errorResponse, ErrorMessages, HttpStatus, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';
import { buildMerchantCanonical, generateNonce, signHmacSha256 } from '@/lib/crypto/hmac';

type MerchantCacheEntry = {
  secret: string;
  status: string;
  nonceTtlSeconds: number;
  version: string | null;
  expiresAt: number;
};

type RequestPayload = {
  amountCents?: number | null;
  currency?: string | null;
  reference?: string | null;
  terminalId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const merchantSecretCache = new Map<string, MerchantCacheEntry>();

const normalizeAmountCents = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('amountCents must be a finite number');
  }
  const rounded = Math.trunc(value);
  if (rounded < 0) {
    throw new Error('amountCents must be zero or positive');
  }
  return rounded;
};

const readJson = async (req: NextRequest): Promise<RequestPayload> => {
  try {
    const payload = (await req.json()) as RequestPayload;
    return payload ?? {};
  } catch {
    throw new Error(ErrorMessages.INVALID_PAYLOAD);
  }
};

const readMerchant = async (
  merchantId: string,
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
) => {
  const cached = merchantSecretCache.get(merchantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const { data, error } = await supabase
    .from('merchants')
    .select('id, status, hmac_secret, nonce_ttl_seconds, secret_rotated_at, updated_at')
    .eq('id', merchantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Failed to load merchant secret');
  }
  if (!data) {
    throw new Error('Merchant not found');
  }

  const version = data.secret_rotated_at ?? data.updated_at ?? null;
  const entry: MerchantCacheEntry = {
    secret: data.hmac_secret,
    status: data.status,
    nonceTtlSeconds: data.nonce_ttl_seconds ?? 300,
    version,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  merchantSecretCache.set(merchantId, entry);
  return entry;
};

export async function POST(req: NextRequest, { params }: { params: { merchantId: string } }) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse(ErrorMessages.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE);
  }

  const merchantId = params.merchantId;
  if (!merchantId) {
    return errorResponse(ErrorMessages.MISSING_REQUIRED_FIELD, HttpStatus.BAD_REQUEST, {
      field: 'merchantId',
    });
  }

  let body: RequestPayload;
  try {
    body = await readJson(req);
  } catch (error) {
    return errorResponse(ErrorMessages.INVALID_PAYLOAD, HttpStatus.BAD_REQUEST, { reason: String(error) });
  }

  let amountCents: number | null = null;
  try {
    amountCents = normalizeAmountCents(body.amountCents);
  } catch (error) {
    return errorResponse(ErrorMessages.INVALID_PAYLOAD, HttpStatus.BAD_REQUEST, { reason: String(error) });
  }

  let merchantEntry: MerchantCacheEntry;
  try {
    merchantEntry = await readMerchant(merchantId, supabase);
  } catch (error) {
    return errorResponse(ErrorMessages.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE, { reason: String(error) });
  }

  if (merchantEntry.status !== 'active') {
    return errorResponse('Merchant is not active', HttpStatus.FORBIDDEN);
  }

  const transactionId = generateNonce();
  const nonce = generateNonce();
  const issuedAtSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = Math.max(merchantEntry.nonceTtlSeconds ?? 300, 30);
  const expiresAt = new Date((issuedAtSeconds + ttlSeconds) * 1000);
  const currency = body.currency?.toUpperCase() ?? 'RWF';

  const canonical = buildMerchantCanonical({
    merchantId,
    transactionId,
    status: 'issued',
    amountCents,
    currency,
    nonce,
    issuedAt: issuedAtSeconds,
  });
  const signature = signHmacSha256(canonical, merchantEntry.secret);

  const metadata = typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {};

  const { error } = await supabase.from('merchant_transactions').insert({
    id: transactionId,
    merchant_id: merchantId,
    user_id: body.userId ?? null,
    terminal_id: body.terminalId ?? null,
    reference: body.reference ?? null,
    amount_cents: amountCents,
    currency,
    status: 'issued',
    issued_at: new Date(issuedAtSeconds * 1000).toISOString(),
    nonce,
    nonce_expires_at: expiresAt.toISOString(),
    signature,
    payload: {
      amountCents,
      currency,
      reference: body.reference ?? null,
      terminalId: body.terminalId ?? null,
    },
    metadata,
  });

  if (error) {
    return errorResponse('Failed to create merchant transaction', HttpStatus.INTERNAL_SERVER_ERROR, {
      reason: error.message ?? error,
    });
  }

  return successResponse({
    merchantId,
    transactionId,
    status: 'issued' as const,
    amountCents,
    currency,
    nonce,
    issuedAt: issuedAtSeconds,
    expiresAt: expiresAt.toISOString(),
    signature,
    canonical,
  }, HttpStatus.CREATED);
}
