"use client";

import { useEffect } from "react";

import { DataTableError } from "@/components/data-table/data-table-error";

const RewardsError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("rewards route error", error);
  }, [error]);

  return <DataTableError message="Unable to load reward claims." onRetry={reset} />;
};

export default RewardsError;
