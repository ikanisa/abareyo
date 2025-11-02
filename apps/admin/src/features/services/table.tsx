"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rayon/ui";
import { CalendarCheck, CalendarClock, ClipboardCheck, ClipboardList, MoreHorizontal } from "lucide-react";

import { useAuditLogger } from "@/audit/use-audit-logger";
import { DataTable } from "@/components/data-table/data-table";
import type { ServiceTicket } from "@/data/types";

const statusMap: Record<ServiceTicket["status"], { label: string; variant: "secondary" | "success" | "warning" | "muted" }> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  in_progress: { label: "In progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const ServicesTable = ({ data, source, error }: { data: ServiceTicket[]; source?: "supabase" | "mock"; error?: string }) => {
  const [rows, setRows] = useState(data);
  const [isPending, startTransition] = useTransition();
  const audit = useAuditLogger();

  const updateStatus = (id: string, status: ServiceTicket["status"], scheduledFor?: string) => {
    startTransition(async () => {
      let previous: ServiceTicket[] = [];
      let existing: ServiceTicket | undefined;
      setRows((current) => {
        previous = current;
        existing = current.find((ticket) => ticket.id === id);
        return current.map((ticket) =>
          ticket.id === id ? { ...ticket, status, scheduled_for: scheduledFor ?? ticket.scheduled_for } : ticket,
        );
      });
      try {
        const response = await fetch(`/api/services/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, scheduled_for: scheduledFor ?? existing?.scheduled_for ?? null }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await audit({ resource: "service_requests", action: "update_status", entityId: id, metadata: { status } });
      } catch (mutationError) {
        console.error("Failed to update service request", mutationError);
        setRows(previous);
      }
    });
  };

  const columns: ColumnDef<ServiceTicket>[] = useMemo(
    () => [
      {
        accessorKey: "service",
        header: "Service",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.service}</p>
            <p className="text-xs text-muted-foreground">Request {row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "member",
        header: "Member",
        cell: ({ row }) => row.original.member,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = statusMap[row.original.status];
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
        filterFn: (row, _, value) => (value ? row.getValue<string>("status") === value : true),
      },
      {
        accessorKey: "scheduled_for",
        header: "Scheduled for",
        cell: ({ row }) => dateFormatter.format(new Date(row.original.scheduled_for)),
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
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "in_progress")}>
                <CalendarClock className="mr-2 size-4" /> Start work
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "completed")}> 
                <ClipboardCheck className="mr-2 size-4" /> Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "cancelled")}> 
                <ClipboardList className="mr-2 size-4" /> Cancel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "scheduled", new Date().toISOString())}>
                <CalendarCheck className="mr-2 size-4" /> Reschedule
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
          options: Object.entries(statusMap).map(([value, meta]) => ({ value, label: meta.label })),
        },
      ]}
      emptyState={{
        title: "No service tickets",
        description: "Operational service requests will be listed here as they are scheduled.",
      }}
      globalSearchPlaceholder="Search by member"
    />
  );
};
