import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  title: string;
  description?: string;
  rows: T[];
  columns: Column<T>[];
  emptyState?: ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({ title, description, rows, columns, emptyState }: DataTableProps<T>) {
  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-sm font-semibold text-slate-50">{title}</p>
          {description ? <p className="text-xs text-slate-400">{description}</p> : null}
        </div>
        {rows.length === 0 && emptyState ? (
          emptyState
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.key)} className="text-slate-400">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="border-slate-800">
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className="text-sm text-slate-200">
                      {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable;
