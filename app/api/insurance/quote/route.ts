import { NextRequest } from "next/server";
import { getSupabase } from '@/app/_lib/supabase';
import { errorResponse, successResponse } from '@/app/_lib/responses';

/** Payloads we accept (both camelCase & snake_case supported) */
type QuoteUser = {
  name?: string;
  phone: string;
  momo_number?: string;
};

type QuotePayloadCamel = {
  userId?: string;
  user?: QuoteUser;
  motoType?: string;
  plate?: string | null;
  periodMonths?: number;
  premium?: number;
  ticketPerk?: boolean;
  ref?: string | null;
};

type QuotePayloadSnake = {
  user_id?: string;
  user?: QuoteUser;
  moto_type?: string;
  plate?: string | null;
  period_months?: number;
  premium?: number;
  ticket_perk?: boolean;
  ref?: string | null;
};

type QuotePayload = QuotePayloadCamel | QuotePayloadSnake;

/** Normalize payload to a single shape */
function normalizePayload(p: QuotePayload | null) {
  if (!p) return null;
  return {
    userId: ("userId" in p ? p.userId : undefined) ?? ("user_id" in p ? p.user_id : undefined),
    user: p.user,
    motoType: ("motoType" in p ? p.motoType : undefined) ?? ("moto_type" in p ? p.moto_type : undefined),
    plate: p.plate ?? null,
    periodMonths:
      ("periodMonths" in p ? p.periodMonths : undefined) ??
      ("period_months" in p ? p.period_months : undefined),
    premium: p.premium,
    ticketPerk:
      ("ticketPerk" in p ? p.ticketPerk : undefined) ??
      ("ticket_perk" in p ? p.ticket_perk : undefined),
    ref: p.ref ?? null,
  } as Required<Pick<QuotePayloadCamel, "motoType">> &
    Partial<QuotePayloadCamel>;
}

/** Find or create a user by phone if userId is not provided */
async function resolveUserId(
  supabase: ReturnType<typeof getSupabase>,
  normalized: ReturnType<typeof normalizePayload>
): Promise<string | null> {
  if (!supabase) return null;
  if (!normalized) return null;

  if (normalized.userId) return normalized.userId;

  const phone = normalized.user?.phone?.replace(/\s+/g, "");
  if (!phone) return null;

  // Try existing
  const { data: existing, error: qErr } = await supabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (!qErr && existing?.id) return existing.id;

  // Create minimal user record
  const { data: created, error: cErr } = await supabase
    .from("users")
    .insert({
      phone,
      name: normalized.user?.name ?? null,
      momo_number: normalized.user?.momo_number ?? phone,
    })
    .select("id")
    .single();

  if (cErr) throw cErr;
  return created.id;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return errorResponse("supabase_config_missing", 500);

  const raw = (await req.json().catch(() => null)) as QuotePayload | null;
  const payload = normalizePayload(raw);
  if (!payload) return errorResponse("invalid_json");

  // Basic validation
  const premiumNum = typeof payload.premium === "number" ? payload.premium : NaN;
  if (Number.isNaN(premiumNum)) return errorResponse("premium is required and must be a number");

  // motoType is optional in main, required in codex version. Keep optional but recommended.
  // If you want to enforce it, uncomment below.
  // if (!payload.motoType) return errorResponse("motoType is required");

  try {
    const userId = await resolveUserId(supabase, payload);

    const ticketPerk =
      typeof payload.ticketPerk === "boolean" ? payload.ticketPerk : premiumNum >= 25_000;

    const { data, error } = await supabase
      .from("insurance_quotes")
      .insert({
        user_id: userId, // may be null if we couldn't resolve; align with DB nullability
        moto_type: payload.motoType ?? null,
        plate: payload.plate ?? null,
        period_months:
          typeof payload.periodMonths === "number" && !Number.isNaN(payload.periodMonths)
            ? Math.round(payload.periodMonths)
            : null,
        premium: Math.round(premiumNum),
        ticket_perk: ticketPerk,
        ref: payload.ref ?? null,
        status: "quoted",
      })
      .select("*")
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse(data, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return errorResponse("supabase_config_missing", 500);

  const payload = (await req.json().catch(() => null)) as {
    id?: string;
    status?: "quoted" | "paid" | "issued";
    ticketPerk?: boolean;
    ref?: string | null;
  } | null;

  if (!payload?.id) return errorResponse("id is required");

  const updates: Record<string, unknown> = {};
  if (payload.status) updates.status = payload.status;
  if (typeof payload.ticketPerk === "boolean") updates.ticket_perk = payload.ticketPerk;
  if (payload.ref !== undefined) updates.ref = payload.ref;

  const { data, error } = await supabase
    .from("insurance_quotes")
    .update(updates)
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 500);
  return successResponse(data);
}
