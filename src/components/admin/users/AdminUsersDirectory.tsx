'use client';

import { useState } from 'react';

import { AdminBottomSheet, AdminInlineMessage, AdminList } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { adminFetch } from '@/lib/admin/csrf';

export type AdminUsersDirectoryProps = {
  initialUsers: Array<{
    id: string;
    display_name: string | null;
    phone: string | null;
    created_at: string;
  }>;
};

export const AdminUsersDirectory = ({ initialUsers }: AdminUsersDirectoryProps) => {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState('');
  const [primaryId, setPrimaryId] = useState('');
  const [secondaryId, setSecondaryId] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const search = async () => {
    const data = await adminFetch(`/admin/api/users/directory${query ? `?q=${encodeURIComponent(query)}` : ''}`).then((res) => res.json());
    setUsers(data.data?.users ?? data.users ?? []);
  };

  const merge = async () => {
    try {
      const response = await adminFetch('/admin/api/users/directory', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ primary_user_id: primaryId, secondary_user_id: secondaryId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'user_merge_failed');
      toast({ title: 'Users merged', description: 'Secondary account removed.' });
      setPrimaryId('');
      setSecondaryId('');
      await search();
    } catch (error) {
      toast({ title: 'Failed to merge users', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminInlineMessage
        tone="info"
        title="Fan directory"
        description="Search fan accounts and merge duplicates to keep USSD journeys tidy."
      />
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="user-search">
            Search
          </label>
          <Input
            id="user-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or phone"
            className="bg-slate-900/70"
          />
        </div>
        <Button type="button" onClick={search} className="md:w-auto">
          Search
        </Button>
      </div>
      <AdminList
        title="Users"
        description="Most recent users matching the current search."
        items={users}
        renderItem={(user) => (
          <button
            type="button"
            onClick={() => setActiveUserId(user.id)}
            className="w-full rounded-xl border border-white/5 bg-slate-950/40 p-4 text-left text-sm text-slate-200 transition hover:border-white/10 hover:bg-slate-900/60"
          >
            <p className="font-semibold text-slate-100">{user.display_name ?? 'Unknown fan'}</p>
            <p className="text-xs text-slate-400">Phone: {user.phone ?? '—'}</p>
            <p className="text-[11px] text-slate-500">Joined: {new Date(user.created_at).toLocaleString()}</p>
          </button>
        )}
      />
      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-100">Merge duplicate accounts</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={primaryId}
            onChange={(event) => setPrimaryId(event.target.value)}
            placeholder="Primary user id"
            className="bg-slate-900/70"
          />
          <Input
            value={secondaryId}
            onChange={(event) => setSecondaryId(event.target.value)}
            placeholder="Secondary user id"
            className="bg-slate-900/70"
          />
        </div>
        <Button onClick={merge} disabled={!primaryId || !secondaryId}>
          Merge users
        </Button>
      </div>
      <AdminBottomSheet
        title="User details"
        open={Boolean(activeUserId)}
        onOpenChange={(open) => {
          if (!open) setActiveUserId(null);
        }}
      >
        {activeUserId ? (
          (() => {
            const user = users.find((item) => item.id === activeUserId);
            if (!user) return <p className="text-sm text-slate-300">User not found in current search.</p>;
            return (
              <div className="space-y-2 text-sm text-slate-200">
                <p className="text-lg font-semibold text-slate-100">{user.display_name ?? 'Unknown fan'}</p>
                <p className="text-xs text-slate-400">ID: {user.id}</p>
                <p className="text-xs text-slate-400">Phone: {user.phone ?? '—'}</p>
                <p className="text-xs text-slate-500">Joined: {new Date(user.created_at).toLocaleString()}</p>
              </div>
            );
          })()
        ) : null}
      </AdminBottomSheet>
    </div>
  );
};
