import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { MembersTableProps } from '@/components/admin/membership/MembersTable';
import type {
  AdminMembershipPlan as MembershipPlan,
  AdminMembershipRecord as MembershipRecord,
  PaginatedResponse,
} from '@/lib/api/admin/membership';

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

const MembersTable = dynamic<MembersTableProps>(
  () => import('@/components/admin/membership/MembersTable').then((mod) => mod.MembersTable),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Loading members…</div> },
);

const MembershipActions = dynamic(
  () => import('@/components/admin/membership/MembershipActions').then((mod) => mod.MembershipActions),
  { ssr: false, loading: () => <div className="text-sm text-slate-300">Preparing actions…</div> },
);

export default async function AdminMembershipPage() {
  const [plansResp, members] = await Promise.all([
    fetchWithSession<{ data: MembershipPlan[] }>(`/admin/membership/plans`, 'membership'),
    fetchWithSession<PaginatedResponse<MembershipRecord>>(`/admin/membership/members?page=1&pageSize=25`, 'membership'),
  ]);
  const plans = plansResp.data;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <header>
          <h1 className="text-2xl font-semibold text-slate-100">Membership</h1>
          <p className="text-sm text-slate-400">Plans and members (read-only placeholder).</p>
        </header>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
          <table className="min-w-[680px] w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-300">
                <th className="whitespace-nowrap px-3 py-2">Plan</th>
                <th className="whitespace-nowrap px-3 py-2">Slug</th>
                <th className="whitespace-nowrap px-3 py-2">Price</th>
                <th className="whitespace-nowrap px-3 py-2">Active</th>
                <th className="whitespace-nowrap px-3 py-2">Perks</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-3 py-2 text-slate-100">{p.name}</td>
                  <td className="px-3 py-2 text-slate-300">{p.slug}</td>
                  <td className="px-3 py-2 text-slate-200">{p.price.toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-300">{p.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-slate-300">{p.perks.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Members</h2>
          <p className="text-sm text-slate-400">Recent memberships.</p>
        </header>
        <MembersTable initial={members} />
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">Actions</h2>
        <p className="text-sm text-slate-400">Create/update plans and manage member statuses.</p>
        <MembershipActions />
      </section>
    </div>
  );
}
