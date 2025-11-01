import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

type ReconcilePayload = {
  merchant_id?: string;
  transaction_id?: string;
  status?: string;
  amount_cents?: number | null;
  currency?: string | null;
  issued_at?: number;
  nonce?: string;
  signature?: string;
};

type MerchantRecord = {
  id: string;
  status: string;
  hmac_secret: string;
  nonce_ttl_seconds: number | null;
};

type TransactionRecord = {
  id: string;
  merchant_id: string;
  status: string;
  amount_cents: number | null;
  currency: string | null;
  nonce: string;
  nonce_expires_at: string;
  nonce_used_at: string | null;
  issued_at: string;
  signature: string | null;
  merchant: MerchantRecord | null;
};

const supabase = getServiceRoleClient();

const VALID_STATUSES = new Set([
  "authorized",
  "captured",
  "failed",
  "reconciled",
  "cancelled",
]);

const FINAL_STATUSES = new Set(["failed", "reconciled", "cancelled"]);

const toBase64Url = (input: ArrayBuffer): string => {
  const bytes = new Uint8Array(input);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const signHmacSha256 = async (secret: string, payload: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
};

const timingSafeEquals = (a: string, b: string): boolean => {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i += 1) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
};

const normalizeCurrency = (value: string | null | undefined): string => (value ? value.toUpperCase() : "");

const normalizeAmount = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isFinite(value)) {
    throw new Error("amount_cents must be finite");
  }
  const rounded = Math.trunc(value);
  if (rounded < 0) {
    throw new Error("amount_cents must be non-negative");
  }
  return rounded;
};

const buildCanonical = (
  merchantId: string,
  transactionId: string,
  status: string,
  amountCents: number | null,
  currency: string | null,
  nonce: string,
  issuedAt: number,
): string =>
  [
    merchantId,
    transactionId,
    status,
    amountCents === null || amountCents === undefined ? "" : amountCents.toString(),
    normalizeCurrency(currency),
    nonce,
    issuedAt.toString(),
  ].join(":");

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<ReconcilePayload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const body = parsed.data ?? {};
  const merchantId = body.merchant_id;
  const transactionId = body.transaction_id;
  const status = body.status;
  const signature = body.signature;
  const issuedAt = body.issued_at;
  const nonce = body.nonce;

  if (!merchantId || !transactionId || !status || !signature || issuedAt === undefined || !nonce) {
    return jsonError("missing_fields", 400, {
      required: ["merchant_id", "transaction_id", "status", "signature", "issued_at", "nonce"],
    });
  }

  if (!VALID_STATUSES.has(status)) {
    return jsonError("invalid_status", 400, { allowed: Array.from(VALID_STATUSES) });
  }

  const amountCentsInput = body.amount_cents ?? null;
  let amountCents: number | null = null;
  try {
    amountCents = normalizeAmount(amountCentsInput);
  } catch (error) {
    return jsonError("invalid_amount", 400, { reason: String(error) });
  }

  const { data: transaction, error: txError } = await supabase
    .from("merchant_transactions")
    .select(
      `id, merchant_id, status, amount_cents, currency, nonce, nonce_expires_at, nonce_used_at, issued_at, signature,
        merchant:merchants (id, status, hmac_secret, nonce_ttl_seconds)`,
    )
    .eq("id", transactionId)
    .maybeSingle<TransactionRecord>();

  if (txError) {
    return jsonError("database_error", 500, { reason: txError.message });
  }

  if (!transaction) {
    return jsonError("transaction_not_found", 404);
  }

  const merchant = transaction.merchant;
  if (!merchant) {
    return jsonError("merchant_not_found", 404);
  }

  if (merchant.id !== merchantId) {
    return jsonError("merchant_mismatch", 403);
  }

  if (merchant.status !== "active") {
    return jsonError("merchant_inactive", 403);
  }

  if (transaction.nonce !== nonce) {
    return jsonError("nonce_mismatch", 409);
  }

  const storedIssuedAt = Math.floor(new Date(transaction.issued_at).getTime() / 1000);
  if (storedIssuedAt !== issuedAt) {
    return jsonError("issued_at_mismatch", 409, { expected: storedIssuedAt });
  }

  const expiresAt = new Date(transaction.nonce_expires_at).getTime();
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return jsonError("nonce_expired", 410);
  }

  if (FINAL_STATUSES.has(transaction.status) && transaction.status !== status) {
    return jsonError("transaction_finalized", 409, { status: transaction.status });
  }

  const effectiveAmount = amountCents ?? transaction.amount_cents ?? null;
  const effectiveCurrency = normalizeCurrency(body.currency ?? transaction.currency ?? null);
  const canonical = buildCanonical(
    merchantId,
    transactionId,
    status,
    effectiveAmount,
    effectiveCurrency,
    transaction.nonce,
    issuedAt,
  );

  const expectedSignature = await signHmacSha256(merchant.hmac_secret, canonical);
  if (!timingSafeEquals(signature, expectedSignature)) {
    return jsonError("invalid_signature", 401);
  }

  if (transaction.signature === signature && transaction.status === status) {
    return json({ ok: true, id: transactionId, status, updated: false });
  }

  const updates: Record<string, unknown> = {
    status,
    signature,
  };

  if (amountCents !== null) {
    updates.amount_cents = amountCents;
  }

  if (body.currency) {
    updates.currency = effectiveCurrency;
  }

  if (!transaction.nonce_used_at) {
    updates.nonce_used_at = new Date().toISOString();
  }

  if (status === "reconciled") {
    updates.reconciled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("merchant_transactions")
    .update(updates)
    .eq("id", transactionId);

  if (updateError) {
    return jsonError("update_failed", 500, { reason: updateError.message });
  }

  return json({ ok: true, id: transactionId, status, updated: true });
});
