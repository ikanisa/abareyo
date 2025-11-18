import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { getSmsIngestToken, requireEnv } from "../_shared/env.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";
import { extractRequestMeta, writeAuditLog } from "../_shared/audit.ts";

type Payload = {
  text?: string;
  from_msisdn?: string;
  received_at?: string;
  source?: string;
  provider?: string;
  provider_message_id?: string;
  idempotency_key?: string;
};

const TOKEN = requireEnv(getSmsIngestToken(), "SMS_INGEST_TOKEN");
const supabase = getServiceRoleClient();

const sanitize = (value: string | null | undefined) => value?.trim() ?? "";

const normalizeTimestamp = (value?: string | null) => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : req.headers.get("x-rayon-sms-token")?.trim();

  if (!token || token !== TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const payload = parsed.data ?? {};
  const text = sanitize(payload.text);
  const provider = sanitize(payload.provider) || req.headers.get("x-sms-provider")?.trim() || "unknown";
  const providerMessageId =
    sanitize(payload.provider_message_id) || req.headers.get("x-provider-message-id")?.trim() || null;
  const explicitIdempotency = sanitize(payload.idempotency_key) || req.headers.get("x-idempotency-key")?.trim();
  const idempotencyKey =
    explicitIdempotency || providerMessageId
      ? `${provider}:${explicitIdempotency ?? providerMessageId}`
      : null;

  if (!text) {
    return jsonError("missing_text", 400);
  }

  const receivedAt = normalizeTimestamp(payload.received_at);
  const source = sanitize(payload.source) || "edge:sms-ingest";
  const sender = sanitize(payload.from_msisdn) || null;

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("sms_raw")
      .select("id, metadata")
      .contains("metadata", { idempotency_key: idempotencyKey })
      .limit(1);

    if (existing && existing.length) {
      const smsId = existing[0].id;
      await writeAuditLog({
        action: "sms.ingest.dedup",
        entityType: "sms_raw",
        entityId: smsId,
        context: { provider, idempotencyKey, source, receivedAt },
        ...extractRequestMeta(req),
      });
      return json({ ok: true, sms_id: smsId, reused: true });
    }
  }

  const { data, error } = await supabase
    .from("sms_raw")
    .insert({
      text,
      from_msisdn: sender,
      received_at: receivedAt,
      source,
      metadata: {
        provider,
        provider_message_id: providerMessageId,
        idempotency_key: idempotencyKey,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[edge:sms-ingest] insert_failed", { error });
    return jsonError(error?.message ?? "insert_failed", 500);
  }

  const smsId = data.id;

  await writeAuditLog({
    action: "sms.ingest.accepted",
    entityType: "sms_raw",
    entityId: smsId,
    after: { text, from_msisdn: sender, source, provider, provider_message_id: providerMessageId },
    context: { receivedAt, idempotencyKey },
    ...extractRequestMeta(req),
  });

  try {
    const url = new URL(req.url);
    url.pathname = "/functions/v1/parse-sms";
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_id: smsId }),
    });
  } catch (err) {
    console.warn("[edge:sms-ingest] parse dispatch failed", err);
  }

  console.log("[edge:sms-ingest] stored", { smsId, receivedAt, source });
  return json({ ok: true, sms_id: smsId });
});
