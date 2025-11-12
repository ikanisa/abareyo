'use client';

import * as React from 'react';
import {
  ColumnDef,
  RowSelectionState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';

import { Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResponsiveSection, responsiveSection } from '@/components/admin/layout/ResponsiveSection';

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  meta?: { page: number; pageSize: number; total: number };
  onPageChange?: (page: number) => void;
  onSearchChange?: (term: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  searchLabel?: string;
  emptyState?: React.ReactNode;
  enableSelection?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  onSelectionChange?: (selectedRows: TData[]) => void;
  renderBatchActions?: (context: { selectedRows: TData[]; clearSelection: () => void }) => React.ReactNode;
  caption?: React.ReactNode;
  captionClassName?: string;
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
  searchLabel = 'Search table results',
  emptyState = <div className="py-6 text-sm text-muted-foreground">No results found.</div>,
  enableSelection = false,
  getRowId,
  onSelectionChange,
  renderBatchActions,
  caption = 'Table results',
  captionClassName = 'sr-only',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const idBase = React.useId().replace(/:/g, '');
  const tableId = `data-table-${idBase}`;
  const searchInputId = `${tableId}-search`;
  const isSearchControlled = typeof searchValue === 'string';
  const resolvedSearchValue = isSearchControlled ? searchValue ?? '' : globalFilter;
  const searchInputId = React.useId();
  const tableCaptionId = React.useId();
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const breakpointValues = React.useMemo(
    () => ({
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    }),
    [],
  );

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

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const viewportWidth = window.innerWidth;

    const flattenColumns = (defs: ColumnDef<TData, unknown>[]): ColumnDef<TData, unknown>[] =>
      defs.flatMap((definition) => {
        if (definition.columns?.length) {
          return flattenColumns(definition.columns as ColumnDef<TData, unknown>[]);
        }
        return definition;
      });

    const leafColumns = flattenColumns(resolvedColumns);
    const initialVisibility: Record<string, boolean> = {};

    leafColumns.forEach((definition) => {
      const identifier =
        (definition.id ? String(definition.id) : undefined) ??
        (typeof definition.accessorKey === 'string' ? definition.accessorKey : undefined);
      if (!identifier) {
        return;
      }

      const meta = definition.meta as
        | {
            responsive?: { hideBelow?: keyof typeof breakpointValues };
          }
        | undefined;

      const hideBelow = meta?.responsive?.hideBelow;
      if (hideBelow && hideBelow in breakpointValues) {
        initialVisibility[identifier] = viewportWidth >= breakpointValues[hideBelow];
      }
    });

    if (Object.keys(initialVisibility).length === 0) {
      return;
    }

    setColumnVisibility((previous) => ({
      ...initialVisibility,
      ...previous,
    }));
  }, [breakpointValues, resolvedColumns]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection: enableSelection ? rowSelection : {},
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
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
  const totalRows = meta?.total ?? rowCount;

  const statusMessage = React.useMemo(() => {
    if (isLoading) {
      return 'Loading results';
    }

    if (rowCount === 0) {
      return 'No results available';
    }

    if (meta) {
      const start = (meta.page - 1) * meta.pageSize + 1;
      const end = Math.min(meta.page * meta.pageSize, meta.total);
      return `Showing ${rowCount} of ${meta.total} rows, rows ${start} to ${end}`;
    }

    return `Showing ${rowCount} rows`;
  }, [isLoading, meta, rowCount]);

  const columnsCanHide = React.useMemo(
    () => table.getAllLeafColumns().filter((column) => column.getCanHide()),
    [table],
  );

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
    <div className="space-y-3" aria-live="polite">
      {onSearchChange ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={searchInputId} className="sr-only">
            {searchPlaceholder}
          </label>
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
          className="w-full max-w-md bg-white/5"
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor={searchInputId} className="sr-only">
            {searchLabel}
          </Label>
          <Input
            id={searchInputId}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            className="max-w-sm bg-white/5 focus-visible:ring-offset-4"
            aria-controls={tableId}
          />
        </div>
            aria-label={searchLabel}
            className="max-w-sm bg-white/5"
          />
        </div>
      {onSearchChange || columnsCanHide.length ? (
        <ResponsiveSection
          columns={onSearchChange && columnsCanHide.length ? 'sidebar' : 'single'}
          className="md:items-end"
        >
          {onSearchChange ? (
            <div className="flex flex-col gap-1">
              <Input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder || 'Search table'}
                className="w-full bg-white/5 md:max-w-sm"
              />
            </div>
          ) : columnsCanHide.length ? (
            <div className="hidden md:block" aria-hidden="true" />
          ) : null}
          {columnsCanHide.length ? (
            <div className={responsiveSection.actionGroup}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/5 text-slate-100">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {columnsCanHide.map((column) => {
                    const meta = column.columnDef.meta as
                      | {
                          columnLabel?: string;
                        }
                      | undefined;

                    let label: string;
                    if (typeof column.columnDef.header === 'string') {
                      label = column.columnDef.header;
                    } else if (meta?.columnLabel) {
                      label = meta.columnLabel;
                    } else {
                      label = column.id;
                    }

                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        className="capitalize"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </ResponsiveSection>
      ) : null}
      {enableSelection && renderBatchActions && selectedRows.length > 0 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary-foreground"
          role="status"
          aria-live="assertive"
        >
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
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
        <Table className="min-w-[720px]">
      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <Table id={tableId} aria-rowcount={totalRows} aria-busy={isLoading}>
        <Table aria-describedby={caption ? tableCaptionId : undefined}>
          {caption ? (
            <TableCaption id={tableCaptionId} className={cn('text-left', captionClassName)}>
              {caption}
            </TableCaption>
          ) : null}
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
          <TableBody className="[&>tr:focus-visible]:outline [&>tr:focus-visible]:outline-2 [&>tr:focus-visible]:outline-offset-2 [&>tr:focus-visible]:outline-primary">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rowCount ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-white/5 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  tabIndex={0}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="break-words text-sm text-slate-100">
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
        <div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div role="status" aria-live="polite">
            Page {meta.page} · {rowCount} of {meta.total} rows
          </div>
          {onPageChange && (
            <div className="flex items-center justify-center gap-2">
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
