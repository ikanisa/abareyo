"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rayon/ui";
import { Download, Settings2 } from "lucide-react";

import { DataTableEmpty } from "./data-table-empty";
import { DataTableError } from "./data-table-error";
import { DataTableToolbar, type FilterOption } from "./data-table-toolbar";

const createCSV = <TData,>(rows: TData[], columns: ColumnDef<TData, any>[]) => {
  const headers = columns.map((column) => ("header" in column ? column.header : column.id ?? ""));
  const serialize = (value: unknown) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") {
      return `"${value.replace(/"/g, '""')}"`;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  };

  const payload = [headers.join(",")];
  rows.forEach((row) => {
    const values = columns.map((column) => {
      const accessor = column.accessorKey as keyof TData | undefined;
      if (accessor) {
        return serialize(row[accessor]);
      }
      if (typeof column.accessorFn === "function") {
        return serialize(column.accessorFn(row));
      }
      return "";
    });
    payload.push(values.join(","));
  });

  return payload.join("\n");
};

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  filterables?: FilterOption[];
  globalSearchPlaceholder?: string;
  emptyState?: { title: string; description: ReactNode };
  error?: string;
  source?: "supabase" | "mock";
}

export const DataTable = <TData,>({
  columns,
  data,
  filterables,
  globalSearchPlaceholder,
  emptyState,
  error,
  source,
}: DataTableProps<TData>) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (original, index) => ("id" in (original as Record<string, unknown>) ? String((original as any).id) : `${index}`),
  });

  const visibleColumns = useMemo(() => table.getAllLeafColumns(), [table]);

  const handleExport = () => {
    const csv = createCSV(table.getFilteredRowModel().rows.map((row) => row.original), columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rayon-admin-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <DataTableToolbar
          table={table}
          filterables={filterables}
          globalSearchPlaceholder={globalSearchPlaceholder}
        />
        <div className="flex items-center gap-2">
          {source ? (
            <Badge variant={source === "mock" ? "warning" : "secondary"}>
              {source === "mock" ? "Demo dataset" : "Live from Supabase"}
            </Badge>
          ) : null}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10">
                <Settings2 className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {visibleColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  className="capitalize"
                >
                  {column.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {error ? <DataTableError message={error} /> : null}
      <div className="rounded-3xl border border-border/40 bg-card/80 shadow-xl shadow-black/10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  {emptyState ? (
                    <DataTableEmpty title={emptyState.title} description={emptyState.description} />
                  ) : (
                    <span className="text-sm text-muted-foreground">No records found</span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          Showing <strong>{table.getRowModel().rows.length}</strong> of <strong>{data.length}</strong> rows
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
