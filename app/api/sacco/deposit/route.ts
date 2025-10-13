import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

type DepositPayload = {
  user_id?: string;
  user?: {
    name?: string;
    phone: string;
    momo_number?: string;
  };
  sacco_name: string;
  amount: number;
};

async function resolveUserId(db: ReturnType<typeof supabase>, payload: DepositPayload) {
  if (payload.user_id) return payload.user_id;
  const phone = payload.user?.phone?.replace(/\s+/g, "");
  if (!phone) return null;
  const { data: existing } = await db.from("users").select("id").eq("phone", phone).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created, error } = await db
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

export async function POST(req: Request) {
  const db = supabase();
  const body = (await req.json()) as DepositPayload;
  if (!body.sacco_name || !body.amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const userId = await resolveUserId(db, body);
    const { data, error } = await db
      .from("sacco_deposits")
      .insert({
        user_id: userId,
        sacco_name: body.sacco_name,
        amount: Math.round(body.amount),
      })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, deposit: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
