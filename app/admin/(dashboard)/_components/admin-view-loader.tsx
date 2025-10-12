import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import AdminViewFallback from "./AdminViewFallback";

type FallbackCopy = {
  title: string;
  description?: string;
};

export const lazyAdminView = <Props extends object>(
  importer: () => Promise<{ default: ComponentType<Props> }>,
  fallback: FallbackCopy,
) =>
  dynamic(importer, {
    ssr: false,
    loading: () => <AdminViewFallback title={fallback.title} description={fallback.description} />,
  });
