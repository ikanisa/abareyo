import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FeatureFlagsTable } from '@/components/admin/settings/FeatureFlagsTable';
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

export default async function AdminSettingsPage() {
  const flags = await fetchWithSession<{ data: AdminFeatureFlag[] }>(`/admin/feature-flags`, 'settings');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Admin Settings</h1>
        <p className="text-sm text-slate-400">Feature flags</p>
      </header>
      <FeatureFlagsTable initial={flags.data} />
    </div>
  );
}

