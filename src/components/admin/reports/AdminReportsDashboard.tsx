'use client';

import { useState } from 'react';

import { AdminInlineMessage, AdminList } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import { adminFetch } from '@/lib/admin/csrf';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

type ReportSchedule = {
  id: string;
  name: string;
  cron: string;
  destination: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_delivered_at: string | null;
  last_delivery_status: string | null;
  last_delivery_error: string | null;
  delivery_metadata: Record<string, unknown> | null;
};

export type AdminReportsDashboardProps = {
  initialSchedules: ReportSchedule[];
};

export const AdminReportsDashboard = ({ initialSchedules }: AdminReportsDashboardProps) => {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 6 * * *');
  const [destination, setDestination] = useState('ops@gikundiro.com');
  const [payload, setPayload] = useState('');
  const [formOpen, setFormOpen] = useState(true);
  const { toast } = useToast();
  const { t } = useAdminLocale();

  const refresh = async () => {
    const data = await adminFetch('/admin/api/reports/schedules').then((res) => res.json());
    setSchedules((data.data?.schedules ?? data.schedules ?? []) as ReportSchedule[]);
  };

  const submit = async () => {
    try {
      const body: Record<string, unknown> = {
        name,
        cron,
        destination,
        dispatch: true,
      };
      if (payload) {
        body.payload = JSON.parse(payload);
      }
      const response = await adminFetch('/admin/api/reports/schedules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? 'report_schedule_failed');
      toast({
        title: t('admin.toast.reports.scheduleCreated', 'Schedule created'),
        description: t('admin.toast.reports.scheduleSaved', 'Report schedule saved successfully.'),
      });
      await refresh();
      setName('');
      setPayload('');
    } catch (error) {
      toast({
        title: t('admin.toast.reports.scheduleFailed', 'Failed to create schedule'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminInlineMessage
        tone="info"
        title={t('admin.reports.inline.title', 'Report automation')}
        description={t(
          'admin.reports.inline.description',
          'Generate CSV exports and deliver them to an email or webhook destination on a schedule.',
        )}
      />
      <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('admin.form.reports.schedule.name.placeholder', 'Report name')}
          className="bg-slate-900/70"
        />
        <Input
          value={cron}
          onChange={(event) => setCron(event.target.value)}
          placeholder={t('admin.form.reports.schedule.cron.placeholder', 'Cron expression')}
          className="bg-slate-900/70"
        />
        <Input
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder={t('admin.form.reports.schedule.destination.placeholder', 'Destination')}
          className="bg-slate-900/70"
        />
        <Input
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          placeholder={t(
            'admin.form.reports.schedule.payload.placeholder',
            'Payload JSON (e.g. {"range":"last7"})',
          )}
          className="bg-slate-900/70"
        />
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={!name || !cron || !destination}>
            {t('admin.reports.schedule.saveButton', 'Save schedule')}
          </Button>
      <Collapsible
        open={formOpen}
        onOpenChange={setFormOpen}
        className="rounded-xl border border-white/10 bg-slate-950/60"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Create schedule</p>
            <p className="text-xs text-slate-400">Provide destination details and an optional JSON payload.</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-4 border-t border-white/10 px-4 py-4">
          <div className="grid gap-3 md:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Report name" className="bg-slate-900/70" />
            <Input value={cron} onChange={(event) => setCron(event.target.value)} placeholder="Cron expression" className="bg-slate-900/70" />
            <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destination" className="bg-slate-900/70" />
            <Input
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              placeholder='Payload JSON (e.g. {"range":"last7"})'
              className="bg-slate-900/70"
            />
          </div>
          <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
            <Button onClick={submit} disabled={!name || !cron || !destination} className="sm:ml-auto">
              Save schedule
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName('');
                setPayload('');
              }}
            >
              Reset form
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <AdminList
        title={t('admin.reports.list.title', 'Active schedules')}
        description={t('admin.reports.list.description', 'Configured report deliveries.')}
        items={schedules}
        renderItem={(item) => {
          const metadata = (item.delivery_metadata ?? {}) as Record<string, unknown>;
          const signedUrl = typeof metadata.signedUrl === 'string' ? (metadata.signedUrl as string) : null;
          const rows = typeof metadata.rows === 'number' ? (metadata.rows as number) : null;
          const destinationType =
            typeof metadata.destinationType === 'string' ? (metadata.destinationType as string) : null;
          return (
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
              <p className="font-semibold text-slate-100">{item.name}</p>
              <p className="text-xs text-slate-400">Cron: {item.cron}</p>
              <p className="text-xs text-slate-500">Destination: {item.destination}</p>
              {destinationType && (
                <p className="text-[11px] text-slate-500">Delivery type: {destinationType}</p>
              )}
              {rows !== null && (
                <p className="text-[11px] text-slate-500">Last export rows: {rows}</p>
              )}
              {signedUrl && (
                <p className="text-[11px]">
                  <a className="text-sky-400 hover:underline" href={signedUrl} target="_blank" rel="noreferrer">
                    Download latest CSV
                  </a>
                </p>
              )}
              {item.next_run_at && (
                <p className="text-[11px] text-slate-500">Next run: {new Date(item.next_run_at).toLocaleString()}</p>
              )}
              {item.last_delivery_status && (
                <p className="text-[11px] text-slate-500">Last status: {item.last_delivery_status}</p>
              )}
              {item.last_delivered_at && (
                <p className="text-[11px] text-slate-500">
                  Last delivered: {new Date(item.last_delivered_at).toLocaleString()}
                </p>
              )}
              {item.last_delivery_error && (
                <p className="text-[11px] text-rose-400">Last error: {item.last_delivery_error}</p>
              )}
              <p className="text-[11px] text-slate-500">Created: {new Date(item.created_at).toLocaleString()}</p>
            </div>
          );
        }}
      />
    </div>
  );
};
