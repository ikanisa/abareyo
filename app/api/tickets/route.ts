import { NextResponse } from "next/server";

import { listTicketsForUser } from "./_queries";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

type TicketPayload = {
  user_id?: string;
  user?: {
    name?: string;
    phone: string;
    momo_number?: string;
  };
  match_id: string;
  zone: "VIP" | "Regular" | "Blue";
  price: number;
  momo_ref?: string | null;
};

async function resolveUserId(db: ReturnType<typeof supabase>, payload: TicketPayload) {
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
  const body = (await req.json()) as TicketPayload;
  if (!body.match_id || !body.zone || !body.price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const userId = await resolveUserId(db, body);
    const payload = {
      match_id: body.match_id,
      zone: body.zone,
      price: Math.round(body.price),
      user_id: userId,
      momo_ref: body.momo_ref ?? null,
    };
    const { data, error } = await db.from("tickets").insert(payload).select("*").single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ticket: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const getAuthToken = () => process.env.TICKETS_API_TOKEN;

export async function GET(req: Request) {
  const expectedToken = getAuthToken();
  if (!expectedToken) {
    return NextResponse.json({ error: "Tickets API token is not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  const phone = searchParams.get("phone");

  if (!userId && !phone) {
    return NextResponse.json({ error: "Missing user scope" }, { status: 400 });
  }

  try {
    const tickets = await listTicketsForUser({ userId, phone });
    return NextResponse.json(tickets);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
