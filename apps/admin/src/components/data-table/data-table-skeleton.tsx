import { Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rayon/ui";

export const DataTableSkeleton = ({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableHead key={index}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((__, colIndex) => (
              <TableCell key={`${rowIndex}-${colIndex}`}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
