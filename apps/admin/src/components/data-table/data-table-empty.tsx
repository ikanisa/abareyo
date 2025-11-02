import { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@rayon/ui";

export const DataTableEmpty = ({ title, description }: { title: string; description: ReactNode }) => (
  <Alert variant="neutral" className="border-dashed border-border/50 bg-muted/20">
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{description}</AlertDescription>
  </Alert>
);
