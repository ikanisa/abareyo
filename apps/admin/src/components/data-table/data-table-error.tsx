import { Alert, AlertDescription, AlertTitle, Button } from "@rayon/ui";

export const DataTableError = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Alert variant="danger" className="border border-destructive/40 bg-destructive/10">
    <AlertTitle>We couldn&apos;t load this data</AlertTitle>
    <AlertDescription className="flex flex-col gap-3">
      <span>{message}</span>
      {onRetry ? (
        <Button size="sm" variant="secondary" className="w-fit" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </AlertDescription>
  </Alert>
);
