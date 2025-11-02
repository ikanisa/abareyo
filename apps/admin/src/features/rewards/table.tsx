"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rayon/ui";
import { CheckCircle2, Gift, HandCoins, XCircle, MoreHorizontal } from "lucide-react";

import { useAuditLogger } from "@/audit/use-audit-logger";
import { DataTable } from "@/components/data-table/data-table";
import type { RewardClaim } from "@/data/types";

const statusCopy: Record<RewardClaim["status"], { label: string; variant: "secondary" | "success" | "warning" | "muted" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  denied: { label: "Denied", variant: "muted" },
  fulfilled: { label: "Fulfilled", variant: "success" },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const RewardsTable = ({ data, source, error }: { data: RewardClaim[]; source?: "supabase" | "mock"; error?: string }) => {
  const [rows, setRows] = useState(data);
  const [isPending, startTransition] = useTransition();
  const audit = useAuditLogger();

  const updateStatus = (id: string, status: RewardClaim["status"], processedAt?: string | null) => {
    startTransition(async () => {
      let previous: RewardClaim[] = [];
      setRows((current) => {
        previous = current;
        return current.map((claim) =>
          claim.id === id ? { ...claim, status, processed_at: processedAt ?? claim.processed_at } : claim,
        );
      });
      try {
        const response = await fetch(`/api/rewards/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, processed_at: processedAt ?? null }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await audit({ resource: "reward_claims", action: "update_status", entityId: id, metadata: { status } });
      } catch (mutationError) {
        console.error("Failed to update reward claim", mutationError);
        setRows(previous);
      }
    });
  };

  const columns: ColumnDef<RewardClaim>[] = useMemo(
    () => [
      {
        accessorKey: "reward",
        header: "Reward",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.reward}</p>
            <p className="text-xs text-muted-foreground">Claim {row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "member",
        header: "Member",
        cell: ({ row }) => row.original.member,
      },
      {
        accessorKey: "points",
        header: "Points",
        cell: ({ row }) => row.original.points.toLocaleString(),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = statusCopy[row.original.status];
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
        filterFn: (row, _, value) => (value ? row.getValue<string>("status") === value : true),
      },
      {
        accessorKey: "processed_at",
        header: "Processed",
        cell: ({ row }) => (row.original.processed_at ? dateFormatter.format(new Date(row.original.processed_at)) : "—"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9" disabled={isPending}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "approved", new Date().toISOString())}>
                <CheckCircle2 className="mr-2 size-4" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "fulfilled", new Date().toISOString())}>
                <Gift className="mr-2 size-4" /> Fulfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "denied", new Date().toISOString())}>
                <XCircle className="mr-2 size-4" /> Deny
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "pending")}> 
                <HandCoins className="mr-2 size-4" /> Reset to pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isPending],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      error={error}
      source={source}
      filterables={[
        {
          id: "status",
          title: "Status",
          options: Object.entries(statusCopy).map(([value, meta]) => ({ value, label: meta.label })),
        },
      ]}
      emptyState={{
        title: "No reward claims",
        description: "Once members redeem their loyalty points, claims will populate this table.",
      }}
      globalSearchPlaceholder="Search by member"
    />
  );
};
