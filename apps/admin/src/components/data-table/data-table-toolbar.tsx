"use client";

import { useMemo } from "react";
import type { Table } from "@tanstack/react-table";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rayon/ui";

export type FilterOption = {
  id: string;
  title: string;
  options: { label: string; value: string }[];
};

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterables?: FilterOption[];
  globalSearchPlaceholder?: string;
}

export const DataTableToolbar = <TData,>({ table, filterables = [], globalSearchPlaceholder }: DataTableToolbarProps<TData>) => {
  const isFiltered = useMemo(() => table.getState().columnFilters.length > 0 || !!table.getState().globalFilter, [table]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Input
          placeholder={globalSearchPlaceholder ?? "Search records"}
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="max-w-xs"
        />
        {filterables.map((filter) => {
          const column = table.getColumn(filter.id);
          if (!column) return null;
          return (
            <Select
              key={filter.id}
              value={(column.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => column.setFilterValue(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.title.toLowerCase()}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        {isFiltered ? (
          <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
};
