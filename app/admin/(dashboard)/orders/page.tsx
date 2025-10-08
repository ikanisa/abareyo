import { cookies } from 'next/headers';
import { Suspense } from 'react';

import { TicketOrdersTable } from '@/components/admin/orders/TicketOrdersTable';
import { ShopOrdersTable } from '@/components/admin/orders/ShopOrdersTable';
import { DonationsTable } from '@/components/admin/orders/DonationsTable';
import type {
  PaginatedResponse,
  AdminTicketOrder,
  AdminShopOrder,
  AdminDonation,
} from '@/lib/api/admin/orders';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

async function fetchWithSession<T>(path: string) {
  const cookieHeader = cookies().toString();
  const response = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await response.json()) as T;
}

const AdminOrdersPage = async () => {
  const [ticketOrders, shopOrders, donations] = await Promise.all([
    fetchWithSession<PaginatedResponse<AdminTicketOrder>>('/admin/ticket-orders'),
    fetchWithSession<PaginatedResponse<AdminShopOrder>>('/admin/shop-orders'),
    fetchWithSession<PaginatedResponse<AdminDonation>>('/admin/donations'),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <header>
          <h1 className="text-2xl font-semibold text-slate-100">Ticket Orders</h1>
          <p className="text-sm text-slate-400">Manage ticket purchases, resend passes, and issue logical refunds.</p>
        </header>
        <Suspense fallback={<div className="text-sm text-slate-300">Loading ticket orders…</div>}>
          <TicketOrdersTable initial={ticketOrders} />
        </Suspense>
      </section>
      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Shop Orders</h2>
          <p className="text-sm text-slate-400">Monitor pick/pack status and courier updates.</p>
        </header>
        <Suspense fallback={<div className="text-sm text-slate-300">Loading shop orders…</div>}>
          <ShopOrdersTable initial={shopOrders} />
        </Suspense>
      </section>
      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Donations</h2>
          <p className="text-sm text-slate-400">Track contribution flow per fundraising project.</p>
        </header>
        <Suspense fallback={<div className="text-sm text-slate-300">Loading donations…</div>}>
          <DonationsTable initial={donations} />
        </Suspense>
      </section>
    </div>
  );
};

export default AdminOrdersPage;
