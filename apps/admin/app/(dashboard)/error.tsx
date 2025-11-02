"use client";

import { useEffect } from "react";

import { DataTableError } from "@/components/data-table/data-table-error";

const DashboardError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("dashboard overview error", error);
  }, [error]);

  return <DataTableError message="Unable to load admin overview." onRetry={reset} />;
};

export default DashboardError;
