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
import { cn } from '@/lib/utils';

export type DataTableFilterFacetOption = {
  label: string;
  value: string;
  count?: number;
  disabled?: boolean;
};

export type DataTableFilterFacet = {
  id: string;
  label: string;
  value: string;
  options: DataTableFilterFacetOption[];
  onChange: (value: string) => void;
};

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  meta?: { page: number; pageSize: number; total: number };
  onPageChange?: (page: number) => void;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  searchDebounceMs?: number;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  enableSelection?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  onSelectionChange?: (selectedRows: TData[]) => void;
  renderBatchActions?: (context: { selectedRows: TData[]; clearSelection: () => void }) => React.ReactNode;
  filterFacets?: DataTableFilterFacet[];
};

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  isError,
  meta,
  onPageChange,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchValue,
  searchDebounceMs = 300,
  emptyState = <div className="py-6 text-sm text-muted-foreground">No results found.</div>,
  errorState = (
    <div className="py-6 text-sm text-destructive">
      Something went wrong while loading this table. Please try again.
    </div>
  ),
  enableSelection = false,
  getRowId,
  onSelectionChange,
  renderBatchActions,
  filterFacets = [],
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState(searchValue ?? '');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  React.useEffect(() => {
    if (onSearchChange) {
      const handler = setTimeout(() => {
        onSearchChange(globalFilter);
      }, searchDebounceMs);
      return () => clearTimeout(handler);
    }
    return undefined;
  }, [globalFilter, onSearchChange, searchDebounceMs]);

  React.useEffect(() => {
    if (typeof searchValue === 'string' && searchValue !== globalFilter) {
      setGlobalFilter(searchValue);
    }
  }, [globalFilter, searchValue]);

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
  const visibleColumnCount = table.getVisibleLeafColumns().length || columns.length || 1;

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
      {onSearchChange || filterFacets.length ? (
        <div className="space-y-3">
          {onSearchChange ? (
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              className="max-w-sm bg-white/5"
            />
          ) : null}
          {filterFacets.length ? (
            <div className="space-y-2">
              {filterFacets.map((facet) => (
                <div key={facet.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">{facet.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {facet.options.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={option.value === facet.value ? 'default' : 'outline'}
                        size="sm"
                        disabled={option.disabled}
                        className={cn(
                          option.value === facet.value
                            ? 'shadow-sm shadow-primary/30'
                            : 'border-white/20 text-slate-200 hover:text-white',
                          option.disabled ? 'opacity-60' : null,
                        )}
                        onClick={() => facet.onChange(option.value)}
                      >
                        <span>{option.label}</span>
                        {typeof option.count === 'number' ? (
                          <span className="ml-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                            {option.count}
                          </span>
                        ) : null}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
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
                <TableCell colSpan={visibleColumnCount} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="py-10 text-center">
                  {errorState}
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
                <TableCell colSpan={visibleColumnCount} className="py-10 text-center">
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
