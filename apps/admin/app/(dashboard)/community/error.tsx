"use client";

import { useEffect } from "react";

import { DataTableError } from "@/components/data-table/data-table-error";

const CommunityError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("community route error", error);
  }, [error]);

  return <DataTableError message="Unable to load community insights." onRetry={reset} />;
};

export default CommunityError;
