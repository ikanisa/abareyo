import { NextRequest } from 'next/server';
import { getSupabase } from '../../_lib/supabase';
import { errorResponse, successResponse } from '../../_lib/responses';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const userId = req.nextUrl.searchParams.get('userId');
  const supabase = getSupabase();
  if (!supabase) {
    return successResponse(id ? null : []);
  }

  let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (id) {
    query = query.eq('id', id).limit(1);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }
  if (id && data && data.length === 0) {
    return errorResponse('Order not found', 404);
  }
  return successResponse(id ? data?.[0] ?? null : data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    userId?: string;
    items?: { productId: string; qty: number }[];
    momoRef?: string;
  } | null;
  if (!payload?.userId || !payload.items?.length) {
    return errorResponse('userId and at least one item are required');
  }

  const productIds = payload.items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from('shop_products')
    .select('id, price')
    .in('id', productIds);
  if (productsError) {
    return errorResponse(productsError.message, 500);
  }

  const priceMap = new Map(products?.map((product) => [product.id, product.price]));
  const lineItems = payload.items.map((item) => {
    const unitPrice = priceMap.get(item.productId) ?? 0;
    return {
      product_id: item.productId,
      qty: item.qty,
      price: unitPrice,
    };
  });
  const total = lineItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: payload.userId,
      total,
      momo_ref: payload.momoRef ?? null,
      status: 'pending',
    })
    .select('*')
    .single();
  if (orderError) {
    return errorResponse(orderError.message, 500);
  }

  const itemsWithOrder = lineItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemError } = await supabase.from('order_items').insert(itemsWithOrder);
  if (itemError) {
    return errorResponse(itemError.message, 500);
  }

  if (payload.momoRef) {
    await supabase.from('transactions').insert({
      user_id: payload.userId,
      amount: total,
      type: 'purchase',
      ref: payload.momoRef,
      status: 'confirmed',
    });
    await supabase.rpc('increment_user_points', {
      p_user_id: payload.userId,
      p_points_delta: total,
    });
  }

  return successResponse({ ...order, items: itemsWithOrder }, 201);
}
