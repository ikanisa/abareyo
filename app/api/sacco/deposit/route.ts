import { NextRequest } from "next/server";
import { getSupabase } from '@/app/_lib/supabase';
import { errorResponse, successResponse } from '@/app/_lib/responses';

// ---------- Payload types & normalizer ----------

type SaccoUser = {
  name?: string;
  phone: string;
  momo_number?: string;
};

type DepositPayloadCamel = {
  userId?: string;
  user?: SaccoUser;
  saccoName?: string;
  amount?: number;
  ref?: string | null;
};

type DepositPayloadSnake = {
  user_id?: string;
  user?: SaccoUser;
  sacco_name?: string;
  amount?: number;
  ref?: string | null;
};

type DepositPayload = DepositPayloadCamel | DepositPayloadSnake;

function normalizePayload(p: DepositPayload | null) {
  if (!p) return null;
  return {
    userId: ("userId" in p ? p.userId : undefined) ?? ("user_id" in p ? p.user_id : undefined),
    user: p.user,
    saccoName: ("saccoName" in p ? p.saccoName : undefined) ?? ("sacco_name" in p ? p.sacco_name : undefined),
    amount: p.amount,
    ref: p.ref ?? null,
  };
}

// ---------- Helpers ----------

async function resolveUserId(supabase: ReturnType<typeof getSupabase>, payload: ReturnType<typeof normalizePayload>) {
  if (!supabase || !payload) return null;
  if (payload.userId) return payload.userId;

  const phone = payload.user?.phone?.replace(/\s+/g, "");
  if (!phone) return null;

  // Try existing by phone
  const { data: existing } = await supabase.from("users").select("id").eq("phone", phone).maybeSingle();
  if (existing?.id) return existing.id;

  // Create minimal user
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      phone,
      name: payload.user?.name ?? null,
      momo_number: payload.user?.momo_number ?? phone,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

// ---------- Routes ----------

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return errorResponse("supabase_config_missing", 500);

  const raw = (await req.json().catch(() => null)) as DepositPayload | null;
  const payload = normalizePayload(raw);
  if (!payload) return errorResponse("invalid_json");

  const saccoName = payload.saccoName?.trim();
  const amountNum = typeof payload.amount === "number" ? payload.amount : NaN;

  if (!saccoName || Number.isNaN(amountNum)) {
    return errorResponse("saccoName and amount are required");
  }

  try {
    const userId = await resolveUserId(supabase, payload);

    const { data, error } = await supabase
      .from("sacco_deposits")
      .insert({
        user_id: userId, // may be null if not resolvable; ensure DB allows it or enforce phone above
        sacco_name: saccoName,
        amount: Math.round(amountNum),
        ref: payload.ref ?? null,
        status: "pending",
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
    status?: "pending" | "confirmed";
    ref?: string | null;
  } | null;

  if (!payload?.id) return errorResponse("id is required");

  const updates: Record<string, unknown> = {};
  if (payload.status) updates.status = payload.status;
  if (payload.ref !== undefined) updates.ref = payload.ref;

  const { data, error } = await supabase
    .from("sacco_deposits")
    .update(updates)
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 500);

  // On confirmation, record a transaction and bump points
  if (payload.status === "confirmed") {
    await supabase.from("transactions").insert({
      user_id: data.user_id,
      amount: data.amount,
      type: "deposit",
      ref: data.ref,
      status: "confirmed",
    });

    if (data.user_id) {
      // Award points equal to deposit amount (adjust logic as needed)
      await supabase.rpc("increment_user_points", {
        p_user_id: data.user_id,
        p_points_delta: data.amount,
      });
    }
  }

  return successResponse(data);
}
