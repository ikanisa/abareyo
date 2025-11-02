"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rayon/ui";
import { CheckCircle2, PackageCheck, RotateCcw, Truck, MoreHorizontal } from "lucide-react";

import { useAuditLogger } from "@/audit/use-audit-logger";
import { DataTable } from "@/components/data-table/data-table";
import type { ShopOrder } from "@/data/types";

const statusLabels: Record<ShopOrder["status"], { label: string; variant: "secondary" | "success" | "warning" | "muted" }> = {
  pending: { label: "Pending", variant: "warning" },
  paid: { label: "Paid", variant: "secondary" },
  fulfilled: { label: "Fulfilled", variant: "success" },
  refunded: { label: "Refunded", variant: "muted" },
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const ShopOrdersTable = ({
  data,
  source,
  error,
}: {
  data: ShopOrder[];
  source?: "supabase" | "mock";
  error?: string;
}) => {
  const [rows, setRows] = useState(data);
  const [isPending, startTransition] = useTransition();
  const audit = useAuditLogger();

  const updateStatus = (id: string, status: ShopOrder["status"], fulfilledAt?: string | null) => {
    startTransition(async () => {
      let previous: ShopOrder[] = [];
      setRows((current) => {
        previous = current;
        return current.map((order) =>
          order.id === id ? { ...order, status, fulfilled_at: fulfilledAt ?? order.fulfilled_at } : order,
        );
      });
      try {
        const response = await fetch(`/api/shop/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, fulfilled_at: fulfilledAt ?? null }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await audit({ resource: "shop_orders", action: "update_status", entityId: id, metadata: { status } });
      } catch (mutationError) {
        console.error("Failed to update order", mutationError);
        setRows(previous);
      }
    });
  };

  const columns: ColumnDef<ShopOrder>[] = useMemo(
    () => [
      {
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.customer}</p>
            <p className="text-xs text-muted-foreground">Order {row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => currency.format(row.original.total),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = statusLabels[row.original.status];
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
        filterFn: (row, _, value) => (value ? row.getValue<string>("status") === value : true),
      },
      {
        accessorKey: "fulfilled_at",
        header: "Fulfilled",
        cell: ({ row }) => (row.original.fulfilled_at ? dateFormatter.format(new Date(row.original.fulfilled_at)) : "—"),
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
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "paid")}>
                <CheckCircle2 className="mr-2 size-4" /> Mark as paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "fulfilled", new Date().toISOString())}>
                <PackageCheck className="mr-2 size-4" /> Fulfil order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "refunded", new Date().toISOString())}>
                <RotateCcw className="mr-2 size-4" /> Refund
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus(row.original.id, "pending")}>
                <Truck className="mr-2 size-4" /> Set pending
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
          options: Object.entries(statusLabels).map(([value, meta]) => ({ value, label: meta.label })),
        },
      ]}
      emptyState={{
        title: "No orders",
        description: "Merchandise sales will appear here as soon as fans place orders.",
      }}
      globalSearchPlaceholder="Search by customer"
    />
  );
};
