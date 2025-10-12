import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type {
  PaginatedResponse,
  AdminShopOrder as ShopOrder,
  AdminShopSummary as ShopSummary,
} from '@/lib/api/admin/shop';
import type { ShopOrdersManageTableProps } from '@/components/admin/shop/ShopOrdersManageTable';

// Types come from admin API clients

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

async function fetchWithSession<T>(path: string, deniedKey: string) {
  const cookieHeader = cookies().toString();
  const response = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (response.status === 401 || response.status === 403) {
    redirect(`/admin?denied=${deniedKey}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await response.json()) as T;
}

const ShopOrdersManageTable = dynamic<ShopOrdersManageTableProps>(
  () => import('@/components/admin/shop/ShopOrdersManageTable').then((mod) => mod.ShopOrdersManageTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading shop orders…</div> },
);

const ShopActions = dynamic(
  () => import('@/components/admin/shop/ShopActions').then((mod) => mod.ShopActions),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading shop actions…</div> },
);

export default async function AdminShopPage() {
  const [summary, orders] = await Promise.all([
    fetchWithSession<{ data: ShopSummary }>(`/admin/shop/summary`, 'orders'),
    fetchWithSession<PaginatedResponse<ShopOrder>>(`/admin/shop/orders?page=1&pageSize=25`, 'orders'),
  ]);

  const totals = summary.data.totalsByStatus;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.totalRevenue.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Avg. Order</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.averageOrderValue.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Outstanding</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.outstandingCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Fulfilled</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.fulfilledCount}</div>
        </div>
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Orders</h2>
          <p className="text-sm text-slate-400">Recent shop orders.</p>
        </header>
        <ShopOrdersManageTable initial={orders} />
        <div className="text-xs text-slate-400">Totals by status: {Object.entries(totals).map(([k, v]) => `${k}:${v}`).join(' • ')}</div>
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">Actions</h2>
        <p className="text-sm text-slate-400">Update statuses, notes, tracking, and run batch updates.</p>
        <ShopActions />
      </section>
    </div>
  );
}
