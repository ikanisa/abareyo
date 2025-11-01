import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/app/_lib/responses";
import { getSupabase } from "@/app/_lib/supabase";
import type { Database, TablesInsert } from "@/integrations/supabase/types";

const ensureAmount = (amount?: number | null) => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return null;
  }
  return Math.max(0, Math.round(amount));
};

const normaliseString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type PaymentKind = Database["public"]["Enums"]["payment_kind"];

type Payload = {
  transactionId?: string;
  amount?: number | null;
  userId?: string | null;
  kind?: PaymentKind | null;
  metadata?: Record<string, unknown> | null;
  orderId?: string | null;
  membershipId?: string | null;
  donationId?: string | null;
  source?: string | null;
};

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = (await req.json().catch(() => null)) as Payload | null;

  const transactionId = normaliseString(body?.transactionId);
  if (!transactionId) {
    return errorResponse("transaction_id_required", 400);
  }

  const amount = ensureAmount(body?.amount ?? null);
  const kind = (body?.kind ?? "ticket") as PaymentKind;
  const userId = normaliseString(body?.userId ?? null);
  const metadata = body?.metadata ?? null;
  const source = normaliseString(body?.source ?? null) ?? "nfc";

  if (!supabase) {
    return successResponse({
      transactionId,
      status: "pending" as const,
      kind,
      amount,
      userId,
      metadata,
      source,
      mock: true,
    });
  }

  const payload: TablesInsert<"payments"> = {
    id: transactionId,
    amount: amount ?? 0,
    kind,
    status: "pending",
    metadata: metadata ? { ...metadata, source } : { source },
    order_id: normaliseString(body?.orderId ?? null),
    membership_id: normaliseString(body?.membershipId ?? null),
    donation_id: normaliseString(body?.donationId ?? null),
  };

  const { data, error } = await supabase
    .from("payments")
    .upsert(payload, { onConflict: "id" })
    .select("id, status, kind, amount")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    transactionId: data.id,
    status: data.status ?? "pending",
    kind: data.kind,
    amount: data.amount,
    userId,
    metadata,
    source,
  });
}
