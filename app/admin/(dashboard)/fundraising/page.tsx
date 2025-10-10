import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FundraisingActions } from '@/components/admin/fundraising/FundraisingActions';
import { FundraisingDonationsTable } from '@/components/admin/fundraising/FundraisingDonationsTable';
import type {
  AdminFundraisingDonation as Donation,
  AdminFundraisingProject as FundProject,
  AdminFundraisingSummary as FundraisingSummary,
  PaginatedResponse,
} from '@/lib/api/admin/fundraising';

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

export default async function AdminFundraisingPage() {
  const [summary, projects, donations] = await Promise.all([
    fetchWithSession<{ data: FundraisingSummary }>(`/admin/fundraising/summary`, 'fundraising'),
    fetchWithSession<PaginatedResponse<FundProject>>(`/admin/fundraising/projects`, 'fundraising'),
    fetchWithSession<PaginatedResponse<Donation>>(`/admin/fundraising/donations?page=1&pageSize=25`, 'fundraising'),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Total Raised</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.totalRaised.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Pending Amount</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.pendingAmount.toLocaleString()} RWF</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Active Projects</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{summary.data.activeProjects}</div>
        </div>
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Projects</h2>
          <p className="text-sm text-slate-400">Manage fundraising projects (read-only placeholder).</p>
        </header>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-300">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Goal</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.data.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-3 py-2 text-slate-100">{p.title}</td>
                  <td className="px-3 py-2 text-slate-200">{p.goal.toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-200">{p.progress}</td>
                  <td className="px-3 py-2 text-slate-300">{p.status}</td>
                  <td className="px-3 py-2 text-slate-400">{new Date(p.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-100">Recent Donations</h2>
          <p className="text-sm text-slate-400">Latest contributions across projects.</p>
        </header>
        <FundraisingDonationsTable initial={donations} />
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">Actions</h2>
        <p className="text-sm text-slate-400">Manage projects and donation statuses.</p>
        <FundraisingActions />
      </section>
    </div>
  );
}
