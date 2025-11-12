'use client';

import { useState } from 'react';

import {
  AdminBottomSheet,
  AdminInlineMessage,
  AdminList,
  CrudConfirmDialog,
  CrudCreateEditModal,
  useCrudUndoToast,
} from '@/components/admin/ui';
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
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeDraft, setMergeDraft] = useState<{ primaryId: string; secondaryId: string }>({
    primaryId: '',
    secondaryId: '',
  });
  const [pendingMerge, setPendingMerge] = useState<{ primaryId: string; secondaryId: string } | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();
  const showUndoToast = useCrudUndoToast();

  const search = async () => {
    const data = await adminFetch(`/admin/api/users/directory${query ? `?q=${encodeURIComponent(query)}` : ''}`).then((res) =>
      res.json(),
    );
    setUsers(data.data?.users ?? data.users ?? []);
  };

  const merge = async ({ primaryId, secondaryId }: { primaryId: string; secondaryId: string }) => {
    try {
      setIsMerging(true);
      const response = await adminFetch('/admin/api/users/directory', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ primary_user_id: primaryId, secondary_user_id: secondaryId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'user_merge_failed');
      setMergeModalOpen(false);
      setMergeDraft({ primaryId: '', secondaryId: '' });
      showUndoToast({ title: 'Users merged', description: 'Secondary account removed.' });
      await search();
    } catch (error) {
      toast({ title: 'Failed to merge users', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsMerging(false);
      setPendingMerge(null);
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
        <div className="flex flex-col gap-2 md:w-auto md:flex-row">
          <Button type="button" onClick={search} className="md:w-auto">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="md:w-auto"
            onClick={() => setMergeModalOpen(true)}
          >
            Merge duplicates
          </Button>
        </div>
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
      <CrudCreateEditModal
        mode="edit"
        title="Merge duplicate accounts"
        description="Select the primary account to keep and the duplicate to archive."
        open={mergeModalOpen}
        onOpenChange={(open) => {
          setMergeModalOpen(open);
          if (!open) {
            setMergeDraft({ primaryId: '', secondaryId: '' });
          }
        }}
        onSubmit={() => {
          if (!mergeDraft.primaryId || !mergeDraft.secondaryId) {
            toast({
              title: 'Missing user IDs',
              description: 'Provide both the primary and secondary account identifiers.',
              variant: 'destructive',
            });
            return;
          }
          setPendingMerge({ ...mergeDraft });
        }}
        submitting={isMerging}
        submitLabel="Review merge"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="primary-user-id">
              Primary user ID
            </label>
            <Input
              id="primary-user-id"
              value={mergeDraft.primaryId}
              onChange={(event) => setMergeDraft((prev) => ({ ...prev, primaryId: event.target.value }))}
              placeholder="Primary account ID"
              className="bg-slate-900/70"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="secondary-user-id">
              Secondary user ID
            </label>
            <Input
              id="secondary-user-id"
              value={mergeDraft.secondaryId}
              onChange={(event) => setMergeDraft((prev) => ({ ...prev, secondaryId: event.target.value }))}
              placeholder="Duplicate account ID"
              className="bg-slate-900/70"
            />
          </div>
          <p className="text-xs text-slate-400">
            Merging keeps all data attached to the primary account and archives the duplicate.
          </p>
        </div>
      </CrudCreateEditModal>
      <CrudConfirmDialog
        intent="danger"
        title="Merge user accounts"
        description="This action cannot be easily reversed. Confirm to keep the primary account."
        confirmLabel="Merge users"
        open={Boolean(pendingMerge)}
        loading={isMerging}
        onOpenChange={(open) => {
          if (!open) {
            setPendingMerge(null);
          }
        }}
        onConfirm={() => {
          if (pendingMerge) {
            void merge(pendingMerge);
          }
        }}
      >
        {pendingMerge ? (
          <div className="space-y-1 text-xs text-slate-200">
            <p>
              <span className="font-semibold text-slate-100">Primary:</span> {pendingMerge.primaryId}
            </p>
            <p>
              <span className="font-semibold text-slate-100">Duplicate:</span> {pendingMerge.secondaryId}
            </p>
          </div>
        ) : null}
      </CrudConfirmDialog>
    </div>
  );
};
