import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminFeatureFlag } from '@/lib/api/admin/feature-flags';

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

type FeatureFlagsTableProps = { initial: AdminFeatureFlag[] };

const FeatureFlagsTable = dynamic<FeatureFlagsTableProps>(
  () => import('@/components/admin/settings/FeatureFlagsTable').then((mod) => mod.FeatureFlagsTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading feature flags…</div> },
);

const AdminAuditLogTable = dynamic(
  () => import('@/components/admin/settings/AdminAuditLogTable').then((mod) => mod.AdminAuditLogTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading audit logs…</div> },
);

export default async function AdminSettingsPage() {
  const flags = await fetchWithSession<{ data: AdminFeatureFlag[] }>(`/admin/feature-flags`, 'settings');

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">Admin Settings</h1>
        <p className="text-sm text-slate-400">Manage rollout guards and review immutable audit history.</p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Feature flags</h2>
          <p className="text-sm text-slate-400">Toggle module availability and staged rollout contexts.</p>
        </div>
        <FeatureFlagsTable initial={flags.data} />
      </section>

      <AdminAuditLogTable />
    </div>
  );
}

