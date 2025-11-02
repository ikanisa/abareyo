"use client";

import { useEffect } from "react";

import { DataTableError } from "@/components/data-table/data-table-error";

const ShopError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("shop route error", error);
  }, [error]);

  return <DataTableError message="Unable to load shop data." onRetry={reset} />;
};

export default ShopError;
