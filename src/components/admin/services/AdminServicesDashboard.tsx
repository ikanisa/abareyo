'use client';

import { useState } from 'react';

import {
  AdminConfirmDialog,
  AdminEditDrawer,
  AdminInlineMessage,
  AdminList,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { adminFetch } from '@/lib/admin/csrf';

export type AdminServicesDashboardProps = {
  initialInsurance: Array<{
    id: string;
    user_id: string | null;
    premium: number;
    status: string;
    ticket_perk: boolean;
    created_at: string;
  }>;
  initialDeposits: Array<{
    id: string;
    user_id: string | null;
    amount: number;
    status: string;
    ref: string | null;
    created_at: string;
  }>;
};

const statusBadge = (status: string) =>
  status === 'issued'
    ? 'text-emerald-300'
    : status === 'paid'
      ? 'text-sky-300'
      : 'text-amber-300';

export const AdminServicesDashboard = ({ initialInsurance, initialDeposits }: AdminServicesDashboardProps) => {
  const [insurance, setInsurance] = useState(initialInsurance);
  const [deposits, setDeposits] = useState(initialDeposits);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [confirmDeposit, setConfirmDeposit] = useState<{ id: string; status: 'pending' | 'confirmed' } | null>(null);
  const { toast } = useToast();

  const quote = insurance.find((item) => item.id === selectedQuote) ?? null;

  const issuePolicy = async (quoteId: string) => {
    try {
      const response = await adminFetch('/admin/api/services/insurance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'policy_issue_failed');
      toast({ title: 'Policy issued', description: 'The policy has been issued successfully.' });
      const refreshed = await adminFetch('/admin/api/services/insurance').then((res) => res.json());
      setInsurance(refreshed.data?.quotes ?? refreshed.quotes ?? []);
    } catch (error) {
      toast({ title: 'Failed to issue policy', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const updateDeposit = async (depositId: string, status: 'pending' | 'confirmed') => {
    try {
      const response = await adminFetch('/admin/api/services/sacco', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: depositId, status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? 'deposit_update_failed');
      toast({ title: 'Deposit updated', description: `Status set to ${status}.` });
      const refreshed = await adminFetch('/admin/api/services/sacco').then((res) => res.json());
      setDeposits(refreshed.data?.deposits ?? refreshed.deposits ?? []);
    } catch (error) {
      toast({ title: 'Failed to update deposit', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <AdminInlineMessage
          tone="info"
          title="Insurance"
          description="Review paid quotes, issue policies, and grant perks where applicable."
        />
        <AdminList
          title="Quotes"
          description="Quotes awaiting issuance or follow-up."
          items={insurance}
          renderItem={(item) => (
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Premium {item.premium.toLocaleString()} RWF</p>
                <p className="text-xs text-slate-400">Quote #{item.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-500">Status: <span className={statusBadge(item.status)}>{item.status}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedQuote(item.id)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => issuePolicy(item.id)}
                  disabled={item.status === 'issued'}
                >
                  Issue policy
                </Button>
              </div>
            </div>
          )}
        />
      </section>
      <section className="space-y-4">
        <AdminInlineMessage
          tone="success"
          title="SACCO Deposits"
          description="Confirm SACCO deposits once reconciled via SMS or ledger uploads."
        />
        <AdminList
          title="Deposits"
          description="Recent SACCO deposits awaiting confirmation."
          items={deposits}
          renderItem={(item) => (
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">{item.amount.toLocaleString()} RWF</p>
                <p className="text-xs text-slate-400">Deposit #{item.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-500">Status: <span className={statusBadge(item.status)}>{item.status}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateDeposit(item.id, 'pending')}
                  disabled={item.status === 'pending'}
                >
                  Mark pending
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmDeposit({ id: item.id, status: 'confirmed' })}
                  disabled={item.status === 'confirmed'}
                >
                  Mark confirmed
                </Button>
              </div>
            </div>
          )}
        />
      </section>
      <AdminEditDrawer
        title="Update quote"
        description="Adjust quote metadata or ticket perk eligibility."
        open={Boolean(selectedQuote && quote)}
        onOpenChange={(open) => {
          if (!open) setSelectedQuote(null);
        }}
        onSubmit={async () => {
          if (!quote) return;
          try {
            setUpdating(true);
            const response = await adminFetch('/admin/api/services/insurance', {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ id: quote.id, status: quote.status, ticket_perk: quote.ticket_perk }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error?.message ?? 'quote_update_failed');
            toast({ title: 'Quote updated', description: 'Changes applied successfully.' });
            const refreshed = await adminFetch('/admin/api/services/insurance').then((res) => res.json());
            setInsurance(refreshed.data?.quotes ?? refreshed.quotes ?? []);
            setSelectedQuote(null);
          } catch (error) {
            toast({ title: 'Failed to update quote', description: (error as Error).message, variant: 'destructive' });
          } finally {
            setUpdating(false);
          }
        }}
        submitting={updating}
      >
        {quote ? (
          <div className="space-y-4 text-sm text-slate-200">
            <p>Quote #{quote.id}</p>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
              <select
                className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={quote.status}
                onChange={(event) =>
                  setInsurance((prev) =>
                    prev.map((item) =>
                      item.id === quote.id ? { ...item, status: event.target.value } : item,
                    ),
                  )
                }
              >
                <option value="quoted">quoted</option>
                <option value="paid">paid</option>
                <option value="issued">issued</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ticket perk
              <input
                type="checkbox"
                checked={quote.ticket_perk}
                onChange={(event) =>
                  setInsurance((prev) =>
                    prev.map((item) =>
                      item.id === quote.id ? { ...item, ticket_perk: event.target.checked } : item,
                    ),
                  )
                }
              />
            </label>
          </div>
        ) : null}
      </AdminEditDrawer>
      <AdminConfirmDialog
        title="Confirm deposit"
        description="Are you sure this SACCO deposit is reconciled?"
        confirmLabel="Confirm deposit"
        cancelLabel="Cancel"
        open={Boolean(confirmDeposit)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeposit(null);
        }}
        onConfirm={async () => {
          if (!confirmDeposit) return;
          await updateDeposit(confirmDeposit.id, confirmDeposit.status);
          setConfirmDeposit(null);
        }}
      />
    </div>
  );
};
