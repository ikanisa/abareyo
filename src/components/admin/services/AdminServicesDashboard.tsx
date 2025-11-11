'use client';

import { useCallback, useMemo, useState } from 'react';

import { AdminConfirmDialog, AdminEditDrawer, AdminInlineMessage, AdminList } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { adminFetch } from '@/lib/admin/csrf';
import { useAdminMutation } from '@/lib/admin-ui';

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

type InsuranceQuote = AdminServicesDashboardProps['initialInsurance'][number];
type DepositEntry = AdminServicesDashboardProps['initialDeposits'][number];

type DepositStatus = 'pending' | 'confirmed';

const statusBadge = (status: string) => {
  switch (status) {
    case 'issued':
      return 'text-emerald-300';
    case 'paid':
      return 'text-sky-300';
    case 'issuing':
      return 'text-amber-200';
    default:
      return 'text-amber-300';
  }
};

const fetchInsurance = async () => {
  const response = await adminFetch('/admin/api/services/insurance');
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'insurance_refresh_failed');
  }
  return (payload.data?.quotes ?? payload.quotes ?? []) as InsuranceQuote[];
};

const fetchDeposits = async () => {
  const response = await adminFetch('/admin/api/services/sacco');
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'deposits_refresh_failed');
  }
  return (payload.data?.deposits ?? payload.deposits ?? []) as DepositEntry[];
};

export const AdminServicesDashboard = ({ initialInsurance, initialDeposits }: AdminServicesDashboardProps) => {
  const [insurance, setInsurance] = useState(initialInsurance);
  const [deposits, setDeposits] = useState(initialDeposits);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [confirmDeposit, setConfirmDeposit] = useState<{ id: string; status: DepositStatus } | null>(null);

  const quote = useMemo(() => insurance.find((item) => item.id === selectedQuote) ?? null, [insurance, selectedQuote]);

  const refreshInsurance = useCallback(async () => {
    try {
      const refreshed = await fetchInsurance();
      setInsurance(refreshed);
    } catch (error) {
      console.error('Failed to refresh insurance', error);
    }
  }, []);

  const refreshDeposits = useCallback(async () => {
    try {
      const refreshed = await fetchDeposits();
      setDeposits(refreshed);
    } catch (error) {
      console.error('Failed to refresh deposits', error);
    }
  }, []);

  const policyMutation = useAdminMutation<{ quoteId: string }, void>({
    mutationFn: async ({ quoteId }) => {
      const response = await adminFetch('/admin/api/services/insurance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'policy_issue_failed');
      }
    },
    getEntityId: ({ quoteId }) => quoteId,
    onMutate: ({ quoteId }) => {
      let snapshot: InsuranceQuote | null = null;
      setInsurance((prev) =>
        prev.map((item) => {
          if (item.id === quoteId) {
            snapshot = item;
            return { ...item, status: 'issuing' };
          }
          return item;
        }),
      );
      return () => {
        if (!snapshot) return;
        setInsurance((prev) => prev.map((item) => (item.id === quoteId ? snapshot! : item)));
      };
    },
    onSuccess: () => {
      void refreshInsurance();
    },
    successToast: {
      title: 'Policy issued',
      description: 'The policy has been issued successfully.',
    },
    errorToast: {
      title: 'Failed to issue policy',
    },
  });

  const depositMutation = useAdminMutation<{ depositId: string; status: DepositStatus }, void>({
    mutationFn: async ({ depositId, status }) => {
      const response = await adminFetch('/admin/api/services/sacco', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: depositId, status }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'deposit_update_failed');
      }
    },
    getEntityId: ({ depositId }) => depositId,
    onMutate: ({ depositId, status }) => {
      let snapshot: DepositEntry | null = null;
      setDeposits((prev) =>
        prev.map((item) => {
          if (item.id === depositId) {
            snapshot = item;
            return { ...item, status };
          }
          return item;
        }),
      );
      return () => {
        if (!snapshot) return;
        setDeposits((prev) => prev.map((item) => (item.id === depositId ? snapshot! : item)));
      };
    },
    onSuccess: () => {
      void refreshDeposits();
    },
    successToast: {
      title: 'Deposit updated',
      description: 'Status updated successfully.',
    },
    errorToast: {
      title: 'Failed to update deposit',
    },
  });

  const updateQuoteMutation = useAdminMutation<{ id: string; status: string; ticket_perk: boolean }, void>({
    mutationFn: async ({ id, status, ticket_perk }) => {
      const response = await adminFetch('/admin/api/services/insurance', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status, ticket_perk }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'quote_update_failed');
      }
    },
    getEntityId: ({ id }) => id,
    onMutate: ({ id, status, ticket_perk }) => {
      let snapshot: InsuranceQuote | null = null;
      setInsurance((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            snapshot = item;
            return { ...item, status, ticket_perk };
          }
          return item;
        }),
      );
      return () => {
        if (!snapshot) return;
        setInsurance((prev) => prev.map((item) => (item.id === id ? snapshot! : item)));
      };
    },
    onSuccess: () => {
      void refreshInsurance();
      setSelectedQuote(null);
    },
    successToast: {
      title: 'Quote updated',
      description: 'Changes applied successfully.',
    },
    errorToast: {
      title: 'Failed to update quote',
    },
  });

  const { state: policyState, execute: executePolicy } = policyMutation;
  const { state: depositState, execute: executeDeposit } = depositMutation;
  const { state: quoteState, execute: executeQuoteUpdate } = updateQuoteMutation;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <AdminInlineMessage
          tone="info"
          title="Insurance"
          description="Review paid quotes, issue policies, and grant perks where applicable."
        />
        {policyState.status === 'error' && policyState.error ? (
          <AdminInlineMessage tone="critical" title="Policy issuance failed" description={policyState.error} />
        ) : null}
        <AdminList
          title="Quotes"
          description="Quotes awaiting issuance or follow-up."
          items={insurance}
          renderItem={(item) => {
            const isIssuing = policyState.status === 'loading' && policyState.activeId === item.id;
            return (
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Premium {item.premium.toLocaleString()} RWF</p>
                  <p className="text-xs text-slate-400">Quote #{item.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">
                    Status: <span className={statusBadge(item.status)}>{item.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedQuote(item.id)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => executePolicy({ quoteId: item.id })}
                    disabled={item.status === 'issued' || isIssuing}
                  >
                    {isIssuing ? 'Issuing…' : 'Issue policy'}
                  </Button>
                </div>
              </div>
            );
          }}
        />
      </section>

      <section className="space-y-4">
        <AdminInlineMessage
          tone="success"
          title="SACCO Deposits"
          description="Confirm SACCO deposits once reconciled via SMS or ledger uploads."
        />
        {depositState.status === 'error' && depositState.error ? (
          <AdminInlineMessage tone="critical" title="Deposit update failed" description={depositState.error} />
        ) : null}
        <AdminList
          title="Deposits"
          description="Recent SACCO deposits awaiting confirmation."
          items={deposits}
          renderItem={(item) => {
            const isUpdating = depositState.status === 'loading' && depositState.activeId === item.id;
            return (
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.amount.toLocaleString()} RWF</p>
                  <p className="text-xs text-slate-400">Deposit #{item.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">
                    Status: <span className={statusBadge(item.status)}>{item.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeDeposit({ depositId: item.id, status: 'pending' })}
                    disabled={item.status === 'pending' || isUpdating}
                  >
                    Mark pending
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmDeposit({ id: item.id, status: 'confirmed' })}
                    disabled={item.status === 'confirmed' || isUpdating}
                  >
                    Mark confirmed
                  </Button>
                </div>
              </div>
            );
          }}
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
          if (!quote || quoteState.status === 'loading') return;
          try {
            await executeQuoteUpdate({ id: quote.id, status: quote.status, ticket_perk: quote.ticket_perk });
          } catch {
            // handled by mutation toast
          }
        }}
        submitting={quoteState.status === 'loading'}
      >
        {quote ? (
          <div className="space-y-4 text-sm text-slate-200">
            <p>Quote #{quote.id}</p>
            {quoteState.status === 'error' && quoteState.error ? (
              <AdminInlineMessage tone="critical" title="Update failed" description={quoteState.error} />
            ) : null}
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
              <select
                className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={quote.status}
                onChange={(event) =>
                  setInsurance((prev) =>
                    prev.map((item) => (item.id === quote.id ? { ...item, status: event.target.value } : item)),
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
        confirmLabel={depositState.status === 'loading' ? 'Confirming…' : 'Confirm deposit'}
        cancelLabel="Cancel"
        open={Boolean(confirmDeposit)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeposit(null);
        }}
        onConfirm={async () => {
          if (!confirmDeposit || depositState.status === 'loading') return;
          try {
            await executeDeposit({ depositId: confirmDeposit.id, status: confirmDeposit.status });
            setConfirmDeposit(null);
          } catch {
            // handled by mutation toast
          }
        }}
      />
    </div>
  );
};
