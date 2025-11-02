"use client";

import { useEffect } from "react";

import { DataTableError } from "@/components/data-table/data-table-error";

const TicketsError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("tickets route error", error);
  }, [error]);

  return <DataTableError message="We hit a snag loading tickets." onRetry={reset} />;
};

export default TicketsError;
