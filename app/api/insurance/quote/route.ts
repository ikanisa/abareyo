import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

type QuotePayload = {
  user_id?: string;
  user?: {
    name?: string;
    phone: string;
    momo_number?: string;
  };
  moto_type: string;
  plate?: string | null;
  period_months: number;
  premium: number;
  ticket_perk?: boolean;
};

async function resolveUserId(db: ReturnType<typeof supabase>, payload: QuotePayload) {
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
  const body = (await req.json()) as QuotePayload;
  if (!body.moto_type || !body.period_months || !body.premium) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const userId = await resolveUserId(db, body);
    const ticketPerk = body.ticket_perk ?? body.premium >= 25000;
    const { data, error } = await db
      .from("insurance_quotes")
      .insert({
        user_id: userId,
        moto_type: body.moto_type,
        plate: body.plate ?? null,
        period_months: body.period_months,
        premium: Math.round(body.premium),
        ticket_perk: ticketPerk,
      })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, quote: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
