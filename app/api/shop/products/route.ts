import { NextRequest } from "next/server";
import { getSupabase } from "../../_lib/supabase";
import { errorResponse, successResponse } from "../../_lib/responses";

// ---------- Types ----------
type UserMini = {
  name?: string;
  phone: string;
  momo_number?: string;
};

type ItemCamel =
  | { productId: string; qty: number } // price from DB
  | { product_name: string; qty: number; price: number }; // create/resolve product by name; use provided price

type ItemSnake =
  | { product_id: string; qty: number }
  | { product_name: string; qty: number; price: number };

type PayloadCamel = {
  userId?: string;
  user?: UserMini;
  items?: ItemCamel[];
  momoRef?: string | null;
};

type PayloadSnake = {
  user_id?: string;
  user?: UserMini;
  items?: ItemSnake[];
  momo_ref?: string | null;
};

type CreateOrderPayload = PayloadCamel | PayloadSnake;

// ---------- Normalizers ----------
function normalizeCreatePayload(p: CreateOrderPayload | null) {
  if (!p) return null;
  const userId = ("userId" in p ? p.userId : undefined) ?? ("user_id" in p ? p.user_id : undefined);
  const itemsRaw = p.items ?? [];
  const momoRef =
    ("momoRef" in p ? p.momoRef : undefined) ??
    ("momo_ref" in p ? p.momo_ref : undefined) ??
    null;

  // Normalize items into a common shape
  const items = itemsRaw.map((it: any) => {
    if ("productId" in it || "product_id" in it) {
      return {
        kind: "byId" as const,
        productId: it.productId ?? it.product_id,
        qty: it.qty,
      };
    }
    return {
      kind: "byName" as const,
      product_name: it.product_name,
      qty: it.qty,
      price: it.price,
    };
  });

  return {
    userId,
    user: p.user,
    items,
    momoRef,
  };
}

// ---------- Helpers ----------
async function resolveUserId(supabase: ReturnType<typeof getSupabase>, userId: string | undefined, user: UserMini | undefined) {
  if (!supabase) return null;
  if (userId) return userId;

  const phone = user?.phone?.replace(/\s+/g, "");
  if (!phone) return null;

  // Try existing
  const { data: existing } = await supabase.from("users").select("id").eq("phone", phone).maybeSingle();
  if (existing?.id) return existing.id;

  // Create minimal user
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      phone,
      name: user?.name ?? null,
      momo_number: user?.momo_number ?? phone,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function resolveProductIdByName(
  supabase: ReturnType<typeof getSupabase>,
  name: string,
  fallbackPrice: number
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("shop_products")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("shop_products")
    .insert({
      name: trimmed,
      category: "misc",
      price: fallbackPrice,
      stock: 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created?.id ?? null;
}

// ---------- GET ----------
export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  // Soft-fail: if no supabase configured, return empty collection (or null if id specified)
  const id = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!supabase) {
    return successResponse(id ? null : []);
  }

  // Detailed selection with joins
  let query = supabase
    .from("orders")
    .select(
      "*, items:order_items(*, product:shop_products(name, image_url)), user:users(id, name, phone)"
    )
    .order("created_at", { ascending: false });

  if (id) query = query.eq("id", id).limit(1);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  if (id && (!data || data.length === 0)) return errorResponse("Order not found", 404);

  return successResponse(id ? data?.[0] ?? null : data ?? []);
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return errorResponse("supabase_config_missing", 500);

  const raw = (await req.json().catch(() => null)) as CreateOrderPayload | null;
  const payload = normalizeCreatePayload(raw);
  if (!payload) return errorResponse("invalid_json");

  if (!payload.items || payload.items.length === 0) {
    return errorResponse("At least one item is required");
  }

  try {
    // Build line items
    // 1) Items with productId -> fetch price from DB
    const byId = payload.items.filter((i) => i.kind === "byId") as Array<{ kind: "byId"; productId: string; qty: number }>;
    const byName = payload.items.filter((i) => i.kind === "byName") as Array<{
      kind: "byName";
      product_name: string;
      qty: number;
      price: number;
    }>;

    // Validate byName entries have price
    for (const it of byName) {
      if (typeof it.price !== "number" || Number.isNaN(it.price)) {
        return errorResponse("Items with product_name must include a numeric price");
      }
    }

    // Fetch prices for byId items
    let priceMap = new Map<string, number>();
    if (byId.length > 0) {
      const ids = byId.map((i) => i.productId);
      const { data: products, error: productsError } = await supabase
        .from("shop_products")
        .select("id, price")
        .in("id", ids);
      if (productsError) return errorResponse(productsError.message, 500);
      priceMap = new Map(products?.map((p) => [p.id, p.price]));
    }

    // Resolve or create product ids for byName items
    const byNameResolved: Array<{ product_id: string; qty: number; price: number }> = [];
    for (const it of byName) {
      const pid = await resolveProductIdByName(supabase, it.product_name, it.price);
      if (!pid) continue; // skip if cannot resolve
      byNameResolved.push({ product_id: pid, qty: it.qty, price: Math.round(it.price) });
    }

    // Build final line items
    const lineItemsFromIds = byId.map((it) => {
      const unitPrice = priceMap.get(it.productId) ?? 0;
      return {
        product_id: it.productId,
        qty: it.qty,
        price: Math.round(unitPrice),
      };
    });

    const lineItems = [...lineItemsFromIds, ...byNameResolved];

    if (lineItems.length === 0) {
      return errorResponse("No valid items to create");
    }

    const total = lineItems.reduce((sum, li) => sum + li.price * li.qty, 0);

    // Resolve user
    const userId = await resolveUserId(supabase, payload.userId, payload.user);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId ?? null, // allow null if DB permits; otherwise enforce phone above
        total,
        momo_ref: payload.momoRef ?? null,
        status: "pending",
      })
      .select("*")
      .single();
    if (orderError) return errorResponse(orderError.message, 500);

    // Insert order items
    const itemsWithOrder = lineItems.map((li) => ({ ...li, order_id: order.id }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsWithOrder);
    if (itemsErr) return errorResponse(itemsErr.message, 500);

    // If momoRef present, record transaction + points (same as main flow)
    if (payload.momoRef) {
      await supabase.from("transactions").insert({
        user_id: userId ?? null,
        amount: total,
        type: "purchase",
        ref: payload.momoRef,
        status: "confirmed",
      });
      if (userId) {
        await supabase.rpc("increment_user_points", {
          p_user_id: userId,
          p_points_delta: total,
        });
      }
    }

    return successResponse({ ...order, items: itemsWithOrder }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
