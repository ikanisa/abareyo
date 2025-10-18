'use client';

import { useState } from 'react';

import { AdminInlineMessage, AdminList } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export type AdminReportsDashboardProps = {
  initialSchedules: Array<{
    id: string;
    name: string;
    cron: string;
    destination: string;
    created_at: string;
  }>;
};

export const AdminReportsDashboard = ({ initialSchedules }: AdminReportsDashboardProps) => {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 6 * * *');
  const [destination, setDestination] = useState('ops@gikundiro.com');
  const [payload, setPayload] = useState('');
  const { toast } = useToast();

  const refresh = async () => {
    const data = await fetch('/admin/api/reports/schedules').then((res) => res.json());
    setSchedules(data.data?.schedules ?? data.schedules ?? []);
  };

  const submit = async () => {
    try {
      const body: Record<string, unknown> = {
        name,
        cron,
        destination,
      };
      if (payload) {
        body.payload = JSON.parse(payload);
      }
      const response = await fetch('/admin/api/reports/schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? 'report_schedule_failed');
      toast({ title: 'Schedule created', description: 'Report schedule saved successfully.' });
      await refresh();
      setName('');
      setPayload('');
    } catch (error) {
      toast({ title: 'Failed to create schedule', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminInlineMessage
        tone="info"
        title="Report automation"
        description="Generate CSV exports and deliver them to an email or webhook destination on a schedule."
      />
      <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Report name" className="bg-slate-900/70" />
        <Input value={cron} onChange={(event) => setCron(event.target.value)} placeholder="Cron expression" className="bg-slate-900/70" />
        <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destination" className="bg-slate-900/70" />
        <Input
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          placeholder='Payload JSON (e.g. {"range":"last7"})'
          className="bg-slate-900/70"
        />
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={!name || !cron || !destination}>Save schedule</Button>
        </div>
      </div>
      <AdminList
        title="Active schedules"
        description="Configured report deliveries."
        items={schedules}
        renderItem={(item) => (
          <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
            <p className="font-semibold text-slate-100">{item.name}</p>
            <p className="text-xs text-slate-400">Cron: {item.cron}</p>
            <p className="text-xs text-slate-500">Destination: {item.destination}</p>
            <p className="text-[11px] text-slate-500">Created: {new Date(item.created_at).toLocaleString()}</p>
          </div>
        )}
      />
    </div>
  );
};
