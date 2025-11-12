'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import type { AdminFeatureFlag } from '@/lib/api/admin/feature-flags';
import { upsertAdminFeatureFlag } from '@/lib/api/admin/feature-flags';

export const FeatureFlagsTable = ({ initial }: { initial: AdminFeatureFlag[] }) => {
  const [flags, setFlags] = useState(initial);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const toggle = (key: string, enabled: boolean) => {
    startTransition(async () => {
      const prev = flags;
      setFlags((f) => f.map((x) => (x.key === key ? { ...x, enabled } : x)));
      try {
        await upsertAdminFeatureFlag({ key, enabled });
        toast({ title: 'Updated', description: `${key} is now ${enabled ? 'on' : 'off'}` });
      } catch (err) {
        setFlags(prev);
        const msg = err instanceof Error ? err.message : 'Failed to update flag';
        toast({ title: 'Update failed', description: msg, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Feature flag toggles with descriptions and last updated timestamps</caption>
        <thead>
          <tr className="bg-white/5 text-slate-300">
            <th className="px-3 py-2">Key</th>
            <th className="px-3 py-2">Enabled</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <tr key={f.key} className="border-t border-white/10">
              <td className="px-3 py-2 font-mono text-xs text-slate-300">{f.key}</td>
              <td className="px-3 py-2">
                <Switch
                  checked={f.enabled}
                  onCheckedChange={(v) => toggle(f.key, !!v)}
                  disabled={isPending}
                  aria-label={`Toggle feature ${f.key}`}
                />
              </td>
              <td className="px-3 py-2 text-slate-300">{f.description ?? '—'}</td>
              <td className="px-3 py-2 text-slate-400">{new Date(f.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

