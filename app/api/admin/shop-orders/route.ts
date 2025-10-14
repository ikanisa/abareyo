import { NextResponse } from 'next/server';

import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import type { Tables } from '@/integrations/supabase/types';

type ShopOrderRow = Tables<'orders'> & {
  users: Pick<Tables<'users'>, 'id' | 'phone' | 'name'> | null;
  order_items: Array<
    Pick<Tables<'order_items'>, 'id' | 'qty' | 'price'> & { shop_products: Pick<Tables<'shop_products'>, 'id' | 'name'> | null }
  > | null;
  payments: Array<Pick<Tables<'payments'>, 'id' | 'amount' | 'status' | 'created_at'>> | null;
};

type SerializedShopOrder = {
  id: string;
  status: Tables<'orders'>['status'];
  total: number;
  createdAt: string;
  user: { id: string; phoneMask: string | null; name: string | null } | null;
  items: Array<{
    id: string;
    qty: number;
    price: number;
    product: { id: string; name: string | null } | null;
  }>;
  payments: Array<{ id: string; amount: number; status: string; createdAt: string }>;
};

const parsePagination = (request: Request) => {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get('page') ?? '1'), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? '20'), 1), 100);
  return {
    page,
    pageSize,
    status: url.searchParams.get('status') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
  };
};

const serializeOrder = (row: ShopOrderRow): SerializedShopOrder => ({
  id: row.id,
  status: row.status,
  total: row.total,
  createdAt: row.created_at,
  user: row.users ? { id: row.users.id, phoneMask: row.users.phone ?? null, name: row.users.name ?? null } : null,
  items: (row.order_items ?? []).map((item) => ({
    id: item.id,
    qty: item.qty,
    price: item.price,
    product: item.shop_products ? { id: item.shop_products.id, name: item.shop_products.name ?? null } : null,
  })),
  payments: (row.payments ?? []).map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.created_at,
  })),
});

export const GET = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'orders.read' });
  if ('response' in result) return result.response;

  const client = getServiceClient();
  const { page, pageSize, status, search } = parsePagination(request);

  let query = client
    .from('orders')
    .select(
      'id, status, total, created_at, users:users(id, phone, name), order_items(id, qty, price, shop_products(id, name)), payments:payments!payments_order_id_fkey(id, amount, status, created_at)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  const allowedStatuses = new Set(['pending', 'paid', 'ready', 'pickedup']);
  const statusFilter =
    status && allowedStatuses.has(status) ? (status as 'pending' | 'paid' | 'ready' | 'pickedup') : undefined;
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  if (search) {
    const safe = search.trim();
    if (safe) {
      query = query.or(`id.eq.${safe}`);
    }
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  const { data, error, count } = await query.range(start, end);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const payload = (data ?? []).map((entry) => serializeOrder(entry as ShopOrderRow));
  return NextResponse.json({
    status: 'ok',
    data: payload,
    meta: { page, pageSize, total: count ?? payload.length },
  });
};
