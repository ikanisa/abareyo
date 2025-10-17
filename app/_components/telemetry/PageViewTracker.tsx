"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { clientConfig } from "@/config/client";
import { recordPageView } from "@/lib/observability";

const LOCALE_PREFIX = /^\/(en|fr|rw)(?=\/|$)/;

const resolveLocale = (pathname: string | null) => {
  if (!pathname) {
    return null;
  }
  const match = pathname.match(LOCALE_PREFIX);
  return match?.[1] ?? null;
};

const PageViewTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRecordedPath = useRef<string | null>(null);

  const search = searchParams?.toString() ?? "";
  const telemetryEndpoint = clientConfig.telemetryEndpoint;

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const pathWithQuery = search ? `${pathname}?${search}` : pathname;

    if (lastRecordedPath.current === pathWithQuery) {
      return;
    }

    lastRecordedPath.current = pathWithQuery;

    const locale = resolveLocale(pathname);
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;
    const title = typeof document !== "undefined" ? document.title : null;

    void recordPageView(
      {
        path: pathWithQuery,
        locale,
        referrer,
        title,
      },
      telemetryEndpoint,
    );
  }, [pathname, search, telemetryEndpoint]);

  return null;
};

export default PageViewTracker;
