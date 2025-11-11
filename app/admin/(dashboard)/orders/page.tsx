import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { TicketOrdersTableProps } from '@/components/admin/orders/TicketOrdersTable';
import type { ShopOrdersTableProps } from '@/components/admin/orders/ShopOrdersTable';
import type { DonationsTableProps } from '@/components/admin/orders/DonationsTable';
import type {
  PaginatedResponse,
  AdminTicketOrder,
  AdminShopOrder,
  AdminDonation,
} from '@/lib/api/admin/orders';
import { AdminSection } from '@/components/admin/layout/AdminSection';

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

const TicketOrdersTable = dynamic<TicketOrdersTableProps>(
  () => import('@/components/admin/orders/TicketOrdersTable').then((mod) => mod.TicketOrdersTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading ticket orders…</div> },
);

const ShopOrdersTable = dynamic<ShopOrdersTableProps>(
  () => import('@/components/admin/orders/ShopOrdersTable').then((mod) => mod.ShopOrdersTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading shop orders…</div> },
);

const DonationsTable = dynamic<DonationsTableProps>(
  () => import('@/components/admin/orders/DonationsTable').then((mod) => mod.DonationsTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading donations…</div> },
);

const AdminOrdersPage = async () => {
  const [ticketOrders, shopOrders, donations] = await Promise.all([
    fetchWithSession<PaginatedResponse<AdminTicketOrder>>('/admin/ticket-orders', 'orders'),
    fetchWithSession<PaginatedResponse<AdminShopOrder>>('/admin/shop-orders', 'orders'),
    fetchWithSession<PaginatedResponse<AdminDonation>>('/admin/donations', 'orders'),
  ]);

  return (
    <div className="space-y-10">
      <section id="ticket-orders" className="space-y-3">
        <header>
    <div className="flex flex-col gap-[var(--space-8)]">
      <AdminSection as="section">
        <div className="space-y-[var(--space-2)]">
          <h1 className="text-2xl font-semibold text-slate-100">Ticket Orders</h1>
          <p className="text-sm text-slate-400">Manage ticket purchases, resend passes, and issue logical refunds.</p>
        </div>
        <TicketOrdersTable initial={ticketOrders} />
      </section>
      <section id="shop-orders" className="space-y-3">
        <header>
      </AdminSection>
      <AdminSection as="section">
        <div className="space-y-[var(--space-2)]">
          <h2 className="text-xl font-semibold text-slate-100">Shop Orders</h2>
          <p className="text-sm text-slate-400">Monitor pick/pack status and courier updates.</p>
        </div>
        <ShopOrdersTable initial={shopOrders} />
      </section>
      <section id="donations" className="space-y-3">
        <header>
      </AdminSection>
      <AdminSection as="section">
        <div className="space-y-[var(--space-2)]">
          <h2 className="text-xl font-semibold text-slate-100">Donations</h2>
          <p className="text-sm text-slate-400">Track contribution flow per fundraising project.</p>
        </div>
        <DonationsTable initial={donations} />
      </AdminSection>
    </div>
  );
};

export default AdminOrdersPage;
