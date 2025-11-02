"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rayon/ui";
import { CheckCircle2, CircleDot, Clock3, MoreHorizontal } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { useAuditLogger } from "@/audit/use-audit-logger";
import type { Ticket } from "@/data/types";

const statusCopy: Record<Ticket["status"], { label: string; variant: "secondary" | "warning" | "success" | "muted" }> = {
  open: { label: "Open", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "muted" },
};

const channelCopy: Record<Ticket["channel"], string> = {
  web: "Web",
  mobile: "Mobile",
  whatsapp: "WhatsApp",
  ussd: "USSD",
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const TicketsTable = ({ data, source, error }: { data: Ticket[]; source?: "supabase" | "mock"; error?: string }) => {
  const [rows, setRows] = useState(data);
  const [isPending, startTransition] = useTransition();
  const audit = useAuditLogger();

  const handleStatusChange = (id: string, status: Ticket["status"]) => {
    const previousRows = rows;
    startTransition(async () => {
      setRows((current) => current.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)));
      try {
        const response = await fetch(`/api/tickets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await audit({ resource: "tickets", action: "update_status", entityId: id, metadata: { status } });
      } catch (mutationError) {
        console.error("Failed to update ticket", mutationError);
        setRows(previousRows);
      }
    });
  };

  const columns: ColumnDef<Ticket>[] = useMemo(
    () => [
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.subject}</p>
            <p className="text-xs text-muted-foreground">Ticket {row.original.id}</p>
          </div>
        ),
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
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <span className="capitalize">{row.original.priority}</span>,
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        cell: ({ row }) => row.original.assignee ?? "Unassigned",
      },
      {
        accessorKey: "channel",
        header: "Channel",
        cell: ({ row }) => channelCopy[row.original.channel],
        filterFn: (row, _, value) => (value ? row.getValue<string>("channel") === value : true),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => formatter.format(new Date(row.original.created_at)),
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
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, "open")}>
                <CircleDot className="mr-2 size-4" /> Mark open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, "pending")}>
                <Clock3 className="mr-2 size-4" /> Move to pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, "resolved")}>
                <CheckCircle2 className="mr-2 size-4" /> Resolve ticket
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, "closed")}>
                <CheckCircle2 className="mr-2 size-4" /> Close ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleStatusChange, isPending],
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
          options: Object.entries(statusCopy).map(([value, meta]) => ({
            value,
            label: meta.label,
          })),
        },
        {
          id: "channel",
          title: "Channel",
          options: Object.entries(channelCopy).map(([value, label]) => ({ value, label })),
        },
      ]}
      emptyState={{
        title: "No tickets",
        description: "Support inbox is quiet right now. Fresh cases will surface here automatically.",
      }}
      globalSearchPlaceholder="Search by subject or assignee"
    />
  );
};
