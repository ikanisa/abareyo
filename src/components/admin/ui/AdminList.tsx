'use client';

import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminButton } from './AdminButton';
import { AdminCard } from './AdminCard';

export type AdminListFilter =
  | { key: string; label: string; type: 'search'; placeholder?: string; value?: string }
  | { key: string; label: string; type: 'select'; placeholder?: string; value?: string; options: Array<{ value: string; label: string }> };

export type AdminListPagination = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
};

export type AdminListProps<TItem> = {
  title: string;
  description?: string;
  filters?: AdminListFilter[];
  onFilterChange?: (key: string, value: string) => void;
  actions?: ReactNode;
  items: TItem[];
  renderItem: (item: TItem, index: number) => ReactNode;
  itemKey?: (item: TItem, index: number) => string;
  pagination?: AdminListPagination;
  emptyState?: ReactNode;
  className?: string;
};

export function AdminList<TItem>({
  title,
  description,
  filters,
  onFilterChange,
  actions,
  items,
  renderItem,
  itemKey,
  pagination,
  emptyState,
  className,
}: AdminListProps<TItem>) {
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const currentPage = pagination ? Math.min(Math.max(1, pagination.page), totalPages) : 1;

  return (
    <AdminCard className={cn('flex flex-col gap-6', className)} tone="muted" padding="md" elevated>
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 self-stretch md:self-auto">{actions}</div> : null}
      </header>
      {filters && filters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-2">
              <Label htmlFor={`admin-list-filter-${filter.key}`} className="text-xs uppercase tracking-wide text-slate-400">
                {filter.label}
              </Label>
              {filter.type === 'search' ? (
                <Input
                  id={`admin-list-filter-${filter.key}`}
                  value={filter.value ?? ''}
                  placeholder={filter.placeholder ?? ''}
                  className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus-visible:ring-primary"
                  onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                />
              ) : (
                <Select
                  value={filter.value ?? ''}
                  onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                  <SelectTrigger
                    id={`admin-list-filter-${filter.key}`}
                    className="border-white/10 bg-slate-950/40 text-left text-sm text-slate-100"
                  >
                    <SelectValue placeholder={filter.placeholder ?? 'Select'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-slate-100">
                    {filter.placeholder ? (
                      <SelectItem value="" className="text-slate-400">
                        {filter.placeholder}
                      </SelectItem>
                    ) : null}
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-slate-100">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        emptyState ?? (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
            No records found. Adjust filters or try again later.
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <Fragment key={itemKey ? itemKey(item, index) : index}>{renderItem(item, index)}</Fragment>
          ))}
        </div>
      )}

      {pagination && totalPages > 1 ? (
        <div className="flex flex-col justify-between gap-3 border-t border-white/5 pt-4 text-sm text-slate-300 md:flex-row md:items-center">
          <span>
            Showing {(currentPage - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.total, currentPage * pagination.pageSize)} of {pagination.total}
          </span>
          <Pagination className="ml-auto">
            <PaginationContent>
              <PaginationItem>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  disabled={currentPage === 1}
                  onClick={() => pagination.onPageChange?.(currentPage - 1)}
                >
                  Previous
                </AdminButton>
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    isActive={idx + 1 === currentPage}
                    onClick={() => pagination.onPageChange?.(idx + 1)}
                    className="cursor-pointer border-white/5 text-slate-200"
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  disabled={currentPage === totalPages}
                  onClick={() => pagination.onPageChange?.(currentPage + 1)}
                >
                  Next
                </AdminButton>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </AdminCard>
  );
}
