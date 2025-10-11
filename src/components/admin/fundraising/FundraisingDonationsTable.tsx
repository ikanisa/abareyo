'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { PaginatedResponse, AdminFundraisingDonation } from '@/lib/api/admin/fundraising';
import {
  fetchAdminFundraisingDonations,
  updateAdminFundraisingDonationStatus,
} from '@/lib/api/admin/fundraising';

const statusFilters = ['all', 'pending', 'confirmed', 'failed', 'manual_review'] as const;
const statusLabels: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
  manual_review: 'Manual review',
};

export type FundraisingDonationsTableProps = {
  initial: PaginatedResponse<AdminFundraisingDonation>;
};

export const FundraisingDonationsTable = ({ initial }: FundraisingDonationsTableProps) => {
  const { toast } = useToast();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadDonations = useCallback(
    async ({ page, search, nextStatus }: { page?: number; search?: string; nextStatus?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetchAdminFundraisingDonations({
          page: page ?? meta.page,
          pageSize: meta.pageSize,
          search: search ?? searchTerm,
          status: (nextStatus ?? status) === 'all' ? undefined : (nextStatus ?? status),
        });
        setData(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error(error);
        toast({ title: 'Failed to load donations', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.pageSize, searchTerm, status, toast],
  );

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      startTransition(() => {
        void loadDonations({ page: 1, search: term });
      });
    },
    [loadDonations],
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      setStatus(value);
      startTransition(() => {
        void loadDonations({ page: 1, nextStatus: value });
      });
    },
    [loadDonations],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        void loadDonations({ page });
      });
    },
    [loadDonations],
  );

  useEffect(() => {
    setData(initial.data);
    setMeta(initial.meta);
  }, [initial]);

  const updateStatus = async (row: AdminFundraisingDonation, value: string) => {
    try {
      const note = noteDrafts[row.id]?.trim();
      const updated = await updateAdminFundraisingDonationStatus(row.id, { status: value, note: note || undefined });
      setData((prev) => prev.map((d) => (d.id === row.id ? { ...d, status: updated.status } : d)));
      toast({ title: 'Donation updated' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast({ title: 'Failed to update donation', description: msg, variant: 'destructive' });
    }
  };

  const columns = useMemo<ColumnDef<AdminFundraisingDonation, unknown>>(
    () => [
      {
        header: 'When',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        header: 'Project',
        cell: ({ row }) => <span className="text-slate-100">{row.original.project?.title ?? '—'}</span>,
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.amount.toLocaleString()} RWF</span>,
      },
      {
        header: 'User',
        cell: ({ row }) => <span className="text-slate-300">{row.original.user?.email ?? row.original.user?.phoneMask ?? '—'}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Select defaultValue={row.original.status} onValueChange={(v) => void updateStatus(row.original, v)}>
              <SelectTrigger className="h-8 w-40 bg-white/5 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['pending', 'confirmed', 'failed', 'manual_review'] as const).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {statusLabels[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Note"
              value={noteDrafts[row.original.id] ?? ''}
              onChange={(e) => setNoteDrafts((m) => ({ ...m, [row.original.id]: e.target.value }))}
              className="h-8 w-40 bg-white/5"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => void updateStatus(row.original, row.original.status)}
            >
              Save
            </Button>
          </div>
        ),
      },
    ],
    [noteDrafts, updateStatus],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-400">Status</span>
        <Select value={status} onValueChange={handleStatusFilter}>
          <SelectTrigger className="h-8 w-48 bg-white/5 text-slate-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        meta={meta}
        isLoading={isLoading || isPending}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search donation id/email/phone"
      />
    </div>
  );
};
