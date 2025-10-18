'use client';

import { useState } from 'react';

import { AdminInlineMessage, AdminList } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

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

  const refresh = async () => {
    const data = await fetch('/admin/api/rewards/events').then((res) => res.json());
    setEvents(data.data?.events ?? data.events ?? []);
  };

  const submit = async () => {
    try {
      const payload: Record<string, unknown> = { user_id: userId };
      if (points) payload.points = Number(points);
      if (matchId) payload.match_id = matchId;
      if (reason) payload.reason = reason;

      const response = await fetch('/admin/api/rewards/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? 'reward_issue_failed');
      toast({ title: 'Reward queued', description: 'Retro reward issued successfully.' });
      await refresh();
      setUserId('');
      setPoints('');
      setMatchId('');
      setReason('');
    } catch (error) {
      toast({ title: 'Failed to issue reward', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminInlineMessage
        tone="info"
        title="Retro issue rewards"
        description="Grant loyalty points or ticket perks when reconciling transactions or handling support cases."
      />
      <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2">
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
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={!userId}>Issue reward</Button>
        </div>
      </div>
      <AdminList
        title="Recent events"
        description="Latest loyalty events recorded in Supabase."
        items={events}
        renderItem={(item) => (
          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
            <p className="font-semibold text-slate-100">{item.source} · {item.points} pts</p>
            <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
            <p className="text-xs text-slate-400">User: {item.user_id ?? 'n/a'} Ref: {item.ref_id ?? '—'}</p>
          </div>
        )}
      />
    </div>
  );
};
