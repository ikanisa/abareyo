import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

type OrderItemInput = {
  product_id?: string;
  product_name?: string;
  qty: number;
  price: number;
};

type OrderPayload = {
  user_id?: string;
  user?: {
    name?: string;
    phone: string;
    momo_number?: string;
  };
  items: OrderItemInput[];
  total: number;
  momo_ref?: string | null;
};

async function resolveUserId(db: ReturnType<typeof supabase>, payload: OrderPayload) {
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

async function resolveProductId(
  db: ReturnType<typeof supabase>,
  item: OrderItemInput,
): Promise<string | null> {
  if (item.product_id) {
    return item.product_id;
  }
  if (!item.product_name) {
    return null;
  }
  const name = item.product_name.trim();
  const { data: existing } = await db
    .from("shop_products")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (existing?.id) {
    return existing.id;
  }
  const { data: created } = await db
    .from("shop_products")
    .insert({
      name,
      category: "misc",
      price: item.price,
      stock: 0,
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

export async function POST(req: Request) {
  const db = supabase();
  const body = (await req.json()) as OrderPayload;
  if (!body.items?.length || !body.total) {
    return NextResponse.json({ error: "Missing items or total" }, { status: 400 });
  }
  try {
    const userId = await resolveUserId(db, body);
    const { data: order, error } = await db
      .from("orders")
      .insert({ total: Math.round(body.total), user_id: userId, momo_ref: body.momo_ref ?? null })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    for (const item of body.items) {
      const productId = await resolveProductId(db, item);
      if (!productId) {
        continue;
      }
      const { error: itemError } = await db
        .from("order_items")
        .insert({ order_id: order.id, product_id: productId, qty: item.qty, price: Math.round(item.price) });
      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const db = supabase();
  const { data, error } = await db
    .from("orders")
    .select("*, items:order_items(*, product:shop_products(name, image_url)), user:users(id, name, phone)")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
