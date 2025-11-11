'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

import { DataTable } from '@/components/admin/DataTable';
import { useToast } from '@/components/ui/use-toast';
import { AdminDonation, PaginatedResponse, fetchAdminDonations } from '@/lib/api/admin/orders';

export type DonationsTableProps = {
  initial: PaginatedResponse<AdminDonation>;
};

export const DonationsTable = ({ initial }: DonationsTableProps) => {
  const { toast } = useToast();
  const [data, setData] = useState(initial.data);
  const [meta, setMeta] = useState(initial.meta);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadDonations = useCallback(
    async ({ page, project }: { page?: number; project?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetchAdminDonations({
          page: page ?? meta.page,
          pageSize: meta.pageSize,
          projectId: project,
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
    [meta.page, meta.pageSize, toast],
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

  const columns = useMemo<ColumnDef<AdminDonation, unknown>[]>(
    () => [
      {
        header: 'Project',
        accessorKey: 'project',
        cell: ({ row }) => <span className="text-sm text-slate-100">{row.original.project.title}</span>,
      },
      {
        header: 'Donor',
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-muted-foreground">Guest</span>;
          return (
            <div className="space-y-0.5 text-sm">
              <div>{user.email ?? '—'}</div>
              <div className="text-xs text-slate-400">{user.phoneMask ?? 'no phone'}</div>
            </div>
          );
        },
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.amount.toLocaleString()} RWF</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">{row.original.status}</span>
        ),
      },
      {
        header: 'Received',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      meta={meta}
      isLoading={isLoading || isPending}
      onPageChange={handlePageChange}
      caption="Donation records grouped by project, donor, and status"
    />
  );
};
