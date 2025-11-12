'use client';

import { useState } from 'react';

import { AdminActionToolbar, AdminInlineMessage, AdminList, AdminStatCard } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import { adminFetch } from '@/lib/admin/csrf';

export type AdminRewardsDashboardProps = {
  initialEvents: Array<{
    id: string;
    user_id: string | null;
    source: string;
    ref_id: string | null;
    points: number;
    created_at: string;
  }>;
};

export const AdminRewardsDashboard = ({ initialEvents }: AdminRewardsDashboardProps) => {
  const [events, setEvents] = useState(initialEvents);
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [matchId, setMatchId] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const { t } = useAdminLocale();

  const refresh = async () => {
    const data = await adminFetch('/admin/api/rewards/events').then((res) => res.json());
    setEvents(data.data?.events ?? data.events ?? []);
  };

  const submit = async () => {
    try {
      const payload: Record<string, unknown> = { user_id: userId };
      if (points) payload.points = Number(points);
      if (matchId) payload.match_id = matchId;
      if (reason) payload.reason = reason;

      const response = await adminFetch('/admin/api/rewards/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? 'reward_issue_failed');
      toast({
        title: t('admin.toast.rewards.queued', 'Reward queued'),
        description: t('admin.toast.rewards.issued', 'Retro reward issued successfully.'),
      });
      await refresh();
      setUserId('');
      setPoints('');
      setMatchId('');
      setReason('');
    } catch (error) {
      toast({
        title: t('admin.toast.rewards.failed', 'Failed to issue reward'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminInlineMessage
        tone="info"
        title={t('admin.rewards.inline.title', 'Retro issue rewards')}
        description={t(
          'admin.rewards.inline.description',
          'Grant loyalty points or ticket perks when reconciling transactions or handling support cases.',
        )}
      />
      <AdminActionToolbar columns={1}>
        <AdminActionToolbar.Section
          title="Retro issue rewards"
          description="Grant loyalty points or ticket perks when reconciling transactions or handling support cases."
          footer={<Button onClick={submit} disabled={!userId}>Issue reward</Button>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="User id"
              className="bg-slate-900/80"
            />
            <Input
              value={points}
              onChange={(event) => setPoints(event.target.value)}
              placeholder="Points (optional)"
              type="number"
              className="bg-slate-900/80"
            />
            <Input
              value={matchId}
              onChange={(event) => setMatchId(event.target.value)}
              placeholder="Match id for ticket perk"
              className="bg-slate-900/80"
            />
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason or note"
              className="bg-slate-900/80"
            />
          </div>
        </AdminActionToolbar.Section>
      </AdminActionToolbar>
      <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2">
        <Input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder={t('admin.form.rewards.userId.placeholder', 'User id')}
          className="bg-slate-900/80"
        />
        <Input
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          placeholder={t('admin.form.rewards.points.placeholder', 'Points (optional)')}
          type="number"
          className="bg-slate-900/80"
        />
        <Input
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
          placeholder={t('admin.form.rewards.matchId.placeholder', 'Match id for ticket perk')}
          className="bg-slate-900/80"
        />
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('admin.form.rewards.reason.placeholder', 'Reason or note')}
          className="bg-slate-900/80"
        />
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={!userId}>
            {t('admin.rewards.actions.issue', 'Issue reward')}
          </Button>
        </div>
      </div>
      <AdminList
        title={t('admin.rewards.list.title', 'Recent events')}
        description={t('admin.rewards.list.description', 'Latest loyalty events recorded in Supabase.')}
        items={events}
        renderItem={(item) => (
          <AdminStatCard
            title={`${item.source} · ${item.points} pts`}
            description={new Date(item.created_at).toLocaleString()}
            variant="muted"
          >
            <p className="text-xs text-slate-400">User: {item.user_id ?? 'n/a'} Ref: {item.ref_id ?? '—'}</p>
          </AdminStatCard>
        )}
      />
    </div>
  );
};
