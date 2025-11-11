'use client';

import * as React from 'react';
import {
  ColumnDef,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  meta?: { page: number; pageSize: number; total: number };
  onPageChange?: (page: number) => void;
  onSearchChange?: (term: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  emptyState?: React.ReactNode;
  enableSelection?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  onSelectionChange?: (selectedRows: TData[]) => void;
  renderBatchActions?: (context: { selectedRows: TData[]; clearSelection: () => void }) => React.ReactNode;
};

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  meta,
  onPageChange,
  onSearchChange,
  searchValue,
  searchPlaceholder = 'Search…',
  emptyState = <div className="py-6 text-sm text-muted-foreground">No results found.</div>,
  enableSelection = false,
  getRowId,
  onSelectionChange,
  renderBatchActions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const isSearchControlled = typeof searchValue === 'string';
  const resolvedSearchValue = isSearchControlled ? searchValue ?? '' : globalFilter;

  React.useEffect(() => {
    if (!isSearchControlled) return;
    setGlobalFilter(searchValue ?? '');
  }, [isSearchControlled, searchValue]);

  React.useEffect(() => {
    if (!onSearchChange || isSearchControlled) {
      return undefined;
    }
    const handler = window.setTimeout(() => {
      onSearchChange(globalFilter);
    }, 300);
    return () => window.clearTimeout(handler);
  }, [globalFilter, isSearchControlled, onSearchChange]);

  const resolvedColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableSelection) {
      return columns;
    }

    const selectionColumn: ColumnDef<TData, unknown> = {
      id: '__select__',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label="Select all rows on current page"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            disabled={!row.getCanSelect()}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    };

    return [selectionColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection: enableSelection ? rowSelection : {},
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    ...(enableSelection
      ? {
          enableRowSelection: true as const,
          onRowSelectionChange: setRowSelection,
        }
      : {}),
    getRowId:
      getRowId ??
      ((originalRow: TData, index: number) => {
        const candidate = (originalRow as { id?: string | number } | undefined)?.id;
        return candidate ? String(candidate) : String(index);
      }),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = React.useMemo(() => {
    if (!enableSelection) {
      return [] as TData[];
    }
    const selectionSize = Object.keys(rowSelection).length;
    if (selectionSize === 0) {
      return [];
    }
    return table.getSelectedRowModel().flatRows.map((row) => row.original);
  }, [enableSelection, rowSelection, table]);

  const rowCount = data.length;

  React.useEffect(() => {
    if (!enableSelection || !onSelectionChange) {
      return;
    }
    onSelectionChange(selectedRows);
  }, [enableSelection, onSelectionChange, selectedRows]);

  const clearSelection = React.useCallback(() => {
    setRowSelection({});
  }, []);

  return (
    <div className="space-y-3">
      {onSearchChange ? (
        <Input
          value={resolvedSearchValue}
          onChange={(event) => {
            const next = event.target.value;
            if (isSearchControlled) {
              onSearchChange?.(next);
            } else {
              setGlobalFilter(next);
            }
          }}
          placeholder={searchPlaceholder}
          className="max-w-sm bg-white/5"
        />
      ) : null}
      {enableSelection && renderBatchActions && selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary-foreground">
          <span className="font-medium">
            {selectedRows.length} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {renderBatchActions({ selectedRows, clearSelection })}
            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-primary-foreground/80 hover:text-primary-foreground">
              Clear
            </Button>
          </div>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <Table>
          <TableHeader className="bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-white/10">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase tracking-wide text-slate-300">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rowCount ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-white/5 hover:bg-white/5">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm text-slate-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {meta && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div>
            Page {meta.page} · {rowCount} of {meta.total} rows
          </div>
          {onPageChange && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={meta.page <= 1 || isLoading}
                onClick={() => onPageChange(meta.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={meta.page * meta.pageSize >= meta.total || isLoading}
                onClick={() => onPageChange(meta.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
