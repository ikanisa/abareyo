'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Smartphone, Timer, Trash2 } from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  addOtpBlacklistEntry,
  fetchOtpBlacklist,
  fetchOtpDashboard,
  removeOtpBlacklistEntry,
} from '@/lib/api/admin/otp';
import type { OtpBlacklistEntry, OtpDashboardSummary } from '@/types/admin-otp';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const numberFormatter = new Intl.NumberFormat();

type BlacklistFormState = {
  type: 'phone' | 'ip';
  value: string;
  note: string;
};

const initialForm: BlacklistFormState = {
  type: 'phone',
  value: '',
  note: '',
};

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Shield;
}) => (
  <GlassCard className="flex items-center gap-3 p-4">
    <div className="rounded-xl bg-primary/15 p-2 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-white">{numberFormatter.format(value)}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </GlassCard>
);

const RedisBadge = ({ status }: { status: OtpDashboardSummary['redis'] }) => {
  const variant = status.healthy ? 'success' : 'destructive';
  const message = status.healthy
    ? `Redis ${status.mode === 'redis' ? 'connected' : 'memory fallback'}`
    : 'Redis unavailable';
  return (
    <Badge
      variant={variant === 'success' ? 'secondary' : 'destructive'}
      className={variant === 'success' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}
    >
      {message}
    </Badge>
  );
};

const renderEventStatus = (event: OtpDashboardSummary['events'][number]) => {
  if (event.kind === 'send') {
    switch (event.status) {
      case 'delivered':
        return <Badge className="bg-emerald-500/20 text-emerald-100">Delivered</Badge>;
      case 'rate_limited':
        return <Badge className="bg-amber-500/20 text-amber-100">Rate limited</Badge>;
      case 'blocked':
        return <Badge className="bg-rose-500/20 text-rose-100">Blocked</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-100">Error</Badge>;
    }
  }

  switch (event.status) {
    case 'success':
      return <Badge className="bg-emerald-500/20 text-emerald-100">Verified</Badge>;
    case 'expired':
      return <Badge className="bg-amber-500/20 text-amber-100">Expired</Badge>;
    case 'locked':
      return <Badge className="bg-rose-500/20 text-rose-100">Locked</Badge>;
    default:
      return <Badge className="bg-rose-500/20 text-rose-100">Failed</Badge>;
  }
};

const BlacklistTable = ({
  label,
  entries,
  onRemove,
  removing,
  type,
}: {
  label: string;
  entries: OtpBlacklistEntry[];
  onRemove: (entry: OtpBlacklistEntry, type: 'phone' | 'ip') => void;
  removing: boolean;
  type: 'phone' | 'ip';
}) => (
  <GlassCard className="p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-medium text-slate-200">{label}</h3>
      <span className="text-xs text-slate-500">{entries.length} entries</span>
    </div>
    <div className="space-y-2">
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No entries configured.</p>
      ) : (
        entries.map((entry) => (
          <div
            key={`${entry.source}-${entry.value}`}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-100">{entry.masked}</p>
              <p className="text-xs text-slate-500">
                Source: {entry.source === 'config' ? 'Environment config' : 'Runtime'}
                {entry.note ? ` • ${entry.note}` : ''}
              </p>
            </div>
            {entry.source === 'runtime' ? (
              <Button
                variant="ghost"
                size="icon"
                disabled={removing}
                onClick={() => onRemove(entry, type)}
                aria-label={`Remove ${entry.masked} from blacklist`}
              >
                <Trash2 className="h-4 w-4 text-rose-200" />
              </Button>
            ) : null}
          </div>
        ))
      )}
    </div>
  </GlassCard>
);

export default function AdminOtpView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BlacklistFormState>(initialForm);

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'otp', 'dashboard'],
    queryFn: fetchOtpDashboard,
    refetchInterval: 30000,
  });

  const blacklistQuery = useQuery({
    queryKey: ['admin', 'otp', 'blacklist'],
    queryFn: async () => {
      const data = await fetchOtpBlacklist();
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: addOtpBlacklistEntry,
    onSuccess: async () => {
      toast({ title: 'Blacklist updated', description: 'Entry added successfully.' });
      setForm(initialForm);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'otp', 'blacklist'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'otp', 'dashboard'] }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update blacklist.';
      toast({ title: 'Failed to add entry', description: message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeOtpBlacklistEntry,
    onSuccess: async () => {
      toast({ title: 'Blacklist updated', description: 'Entry removed successfully.' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'otp', 'blacklist'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'otp', 'dashboard'] }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update blacklist.';
      toast({ title: 'Failed to remove entry', description: message, variant: 'destructive' });
    },
  });

  const summary = dashboardQuery.data?.summary;
  const redis = dashboardQuery.data?.redis;
  const template = dashboardQuery.data?.template;
  const events = dashboardQuery.data?.events ?? [];
  const rateLimits = dashboardQuery.data?.rateLimits;

  const phoneBlacklist = blacklistQuery.data?.phone ?? [];
  const ipBlacklist = blacklistQuery.data?.ip ?? [];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.value.trim()) {
      toast({ title: 'Value required', description: 'Provide a phone number or IP to block.' });
      return;
    }
    addMutation.mutate({ type: form.type, value: form.value.trim(), note: form.note.trim() || undefined });
  };

  const handleRemove = (entry: OtpBlacklistEntry, type: 'phone' | 'ip') => {
    removeMutation.mutate({ type, value: entry.value });
  };

  const derivedRateLimitCopy = useMemo(() => {
    if (!rateLimits) return '';
    const windowMinutes = Math.round(rateLimits.windowSeconds / 60);
    return `${rateLimits.maxPerPhone} per number and ${rateLimits.maxPerIp} per IP every ${windowMinutes} minutes`;
  }, [rateLimits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">OTP Operations</h1>
          <p className="text-sm text-slate-400">
            Monitor WhatsApp OTP throughput, Redis health, and apply runtime abuse controls.
          </p>
        </div>
        {redis ? <RedisBadge status={redis} /> : <Skeleton className="h-6 w-24 rounded-full" />}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Codes sent"
          value={summary?.sent ?? 0}
          description="All OTP attempts over the current process"
          icon={Smartphone}
        />
        <SummaryCard
          title="Verified"
          value={summary?.verified ?? 0}
          description="Successful OTP verifications"
          icon={Shield}
        />
        <SummaryCard
          title="Rate limited"
          value={summary?.rateLimited ?? 0}
          description="Requests blocked by abuse controls"
          icon={Timer}
        />
      </div>

      <GlassCard className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-slate-100">WhatsApp template</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <Badge className="bg-primary/20 text-primary">{template?.name ?? 'unknown'}</Badge>
          {template?.approved ? (
            <Badge className="bg-emerald-500/20 text-emerald-100">Approved</Badge>
          ) : (
            <Badge className="bg-rose-500/20 text-rose-100">Pending approval</Badge>
          )}
          {template?.rateLimitApproval ? (
            <a
              className="text-xs text-slate-300 underline"
              href={template.rateLimitApproval}
              target="_blank"
              rel="noreferrer"
            >
              Rate-limit policy
            </a>
          ) : null}
        </div>
        {rateLimits ? (
          <p className="text-xs text-slate-500">
            Rate limits: {derivedRateLimitCopy}. Cooldown {rateLimits.cooldownSeconds}s, verify max{' '}
            {rateLimits.maxVerifyAttempts} attempts every {Math.round(rateLimits.verifyWindowSeconds / 60)} minutes.
          </p>
        ) : null}
      </GlassCard>

      <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Recent events</h2>
          <span className="text-xs text-slate-500">Latest {events.length} entries</span>
        </div>
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No OTP activity recorded yet.</p>
          ) : (
            events.map((event) => (
              <div
                key={`${event.kind}-${event.occurredAt}-${event.phoneHash}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {event.kind === 'send' ? 'Send' : 'Verify'} · {event.phoneHash.slice(0, 12)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dateFormatter.format(new Date(event.occurredAt))}
                    {event.kind === 'send' && event.channel ? ` • ${event.channel}` : ''}
                    {event.ip ? ` • IP ${event.ip}` : ''}
                    {event.kind === 'send' && event.locale ? ` • Locale ${event.locale}` : ''}
                  </p>
                  {event.reason ? <p className="text-xs text-slate-400">{event.reason}</p> : null}
                </div>
                <div>{renderEventStatus(event)}</div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-slate-100">Add to blacklist</h2>
          <p className="mb-3 text-xs text-slate-500">
            Block abusive WhatsApp numbers or IP addresses in real time. Config-managed entries remain read-only.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.type === 'phone' ? 'default' : 'secondary'}
                onClick={() => setForm((prev) => ({ ...prev, type: 'phone' }))}
              >
                Phone
              </Button>
              <Button
                type="button"
                variant={form.type === 'ip' ? 'default' : 'secondary'}
                onClick={() => setForm((prev) => ({ ...prev, type: 'ip' }))}
              >
                IP
              </Button>
            </div>
            <Input
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              placeholder={form.type === 'phone' ? '+2507XXXXXXXX' : '192.168.0.1'}
            />
            <Textarea
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Optional note (e.g. incident ticket link)"
              rows={3}
            />
            <Button type="submit" disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending ? 'Adding…' : 'Add to blacklist'}
            </Button>
          </form>
        </GlassCard>
        <div className="space-y-4">
          <BlacklistTable
            label="Phone blacklist"
            entries={phoneBlacklist}
            onRemove={handleRemove}
            removing={removeMutation.isPending}
            type="phone"
          />
          <BlacklistTable
            label="IP blacklist"
            entries={ipBlacklist}
            onRemove={handleRemove}
            removing={removeMutation.isPending}
            type="ip"
          />
        </div>
      </div>
    </div>
  );
}
