"use client";

import { useEffect } from "react";

import { DataTableError } from "@/components/data-table/data-table-error";

const ServicesError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("services route error", error);
  }, [error]);

  return <DataTableError message="Unable to load service requests." onRetry={reset} />;
};

export default ServicesError;
