import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';
import { getSupabaseSecretKey, getSupabaseUrl } from '@/integrations/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const isSupabaseConfigured = () => Boolean(getSupabaseUrl() && getSupabaseSecretKey());

type PaymentRow = {
  id: string;
  amount: number;
  currency: string | null;
  kind: string | null;
  status: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
  order_id: string | null;
  ticket_order_id: string | null;
  membership_id: string | null;
  donation_id: string | null;
  sms_parsed?: { id: string; amount?: number | null; currency?: string | null; ref?: string | null; confidence?: number | null } | null;
};

const mapManualPayment = ({
  row,
  order,
  ticketOrder,
  membership,
  membershipPlan,
  donation,
  donationProject,
}: {
  row: PaymentRow;
  order?: { id: string; status: string | null } | null;
  ticketOrder?: { id: string; status: string | null } | null;
  membership?: { id: string; plan_id: string | null } | null;
  membershipPlan?: { id: string; name: string | null } | null;
  donation?: { id: string; project_id: string | null } | null;
  donationProject?: { id: string; title: string | null } | null;
}) => ({
  id: row.id,
  amount: Number(row.amount ?? 0),
  currency: row.currency ?? 'RWF',
  kind: (row.kind as 'ticket' | 'membership' | 'shop' | 'donation' | undefined) ?? 'ticket',
  status: row.status ?? 'manual_review',
  createdAt: row.created_at ?? new Date().toISOString(),
  metadata: row.metadata ?? null,
  order: order
    ? { id: order.id, status: order.status ?? null }
    : ticketOrder
      ? { id: ticketOrder.id, status: ticketOrder.status ?? null }
      : null,
  membership: membership
    ? {
        id: membership.id,
        plan: membershipPlan ? { name: membershipPlan.name ?? '' } : null,
      }
    : null,
  donation: donation
    ? {
        id: donation.id,
        project: donationProject ? { title: donationProject.title ?? '' } : null,
      }
    : null,
  smsParsed: row.sms_parsed
    ? {
        id: row.sms_parsed.id,
        amount: Number(row.sms_parsed.amount ?? 0),
        currency: row.sms_parsed.currency ?? 'RWF',
        ref: row.sms_parsed.ref ?? 'UNKNOWN',
        confidence: Number(row.sms_parsed.confidence ?? 0),
      }
    : null,
});

const buildIdSet = (rows: PaymentRow[], key: keyof PaymentRow) => {
  const ids = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === 'string' && value) {
      ids.add(value);
    }
  }
  return Array.from(ids);
};

const fetchMap = async <T extends { id: string }>(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  ids: string[],
  select: string,
) => {
  if (ids.length === 0) return new Map<string, T>();
  const { data, error } = await supabase.from(table).select(select).in('id', ids);
  if (error) throw error;
  return new Map(((data ?? []) as unknown as T[]).map((item) => [item.id, item]));
};

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { payments: [] },
        { status: 503, headers: { 'x-admin-offline': 'supabase-missing' } },
      );
    }

    const supabase = getSupabaseAdmin();
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam ?? '50'), 1), 200);

    const { data, error } = await supabase
      .from('payments')
      .select(
        'id, amount, currency, kind, status, created_at, metadata, order_id, ticket_order_id, membership_id, donation_id, sms_parsed(id, amount, currency, ref, confidence)',
      )
      .eq('status', 'manual_review')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    const rows = ((data ?? []) as unknown as PaymentRow[]);

    const orderIds = buildIdSet(rows, 'order_id');
    const ticketOrderIds = buildIdSet(rows, 'ticket_order_id');
    const membershipIds = buildIdSet(rows, 'membership_id');
    const donationIds = buildIdSet(rows, 'donation_id');

    const [ordersMap, ticketOrdersMap, membershipsMap, donationsMap] = await Promise.all([
      fetchMap<{ id: string; status: string | null }>(supabase, 'orders', orderIds, 'id, status'),
      fetchMap<{ id: string; status: string | null }>(supabase, 'ticket_orders', ticketOrderIds, 'id, status'),
      fetchMap<{ id: string; plan_id: string | null }>(supabase, 'memberships', membershipIds, 'id, plan_id'),
      fetchMap<{ id: string; project_id: string | null }>(supabase, 'fund_donations', donationIds, 'id, project_id'),
    ]);

    const membershipPlanIds = Array.from(
      new Set(Array.from(membershipsMap.values()).map((m) => m.plan_id).filter((id): id is string => Boolean(id))),
    );
    const donationProjectIds = Array.from(
      new Set(
        Array.from(donationsMap.values()).map((d) => d.project_id).filter((id): id is string => Boolean(id)),
      ),
    );

    const [plansMap, projectsMap] = await Promise.all([
      fetchMap<{ id: string; name: string | null }>(supabase, 'membership_plans', membershipPlanIds, 'id, name'),
      fetchMap<{ id: string; title: string | null }>(supabase, 'fund_projects', donationProjectIds, 'id, title'),
    ]);

    const payments = rows.map((row) =>
      mapManualPayment({
        row,
        order: row.order_id ? ordersMap.get(row.order_id) : undefined,
        ticketOrder: row.ticket_order_id ? ticketOrdersMap.get(row.ticket_order_id) : undefined,
        membership: row.membership_id ? membershipsMap.get(row.membership_id) : undefined,
        membershipPlan:
          row.membership_id && membershipsMap.get(row.membership_id)?.plan_id
            ? plansMap.get(membershipsMap.get(row.membership_id)!.plan_id!)
            : undefined,
        donation: row.donation_id ? donationsMap.get(row.donation_id) : undefined,
        donationProject:
          row.donation_id && donationsMap.get(row.donation_id)?.project_id
            ? projectsMap.get(donationsMap.get(row.donation_id)!.project_id!)
            : undefined,
      }),
    );

    return NextResponse.json({ payments });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load manual-review payments', error);
    return NextResponse.json({ error: 'manual_payments_fetch_failed' }, { status: 500 });
  }
}
