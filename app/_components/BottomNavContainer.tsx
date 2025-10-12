"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

const LOCALE_PREFIX = /^\/(en|fr|rw)(?=\/|$)/;
const HIDDEN_PREFIXES = ["/admin", "/api"];
const HIDDEN_ROUTES = new Set(["/admin/login"]);

const stripLocale = (pathname: string | null) => {
  if (!pathname) {
    return "/";
  }

  return pathname.replace(LOCALE_PREFIX, "") || "/";
};

const shouldRenderBottomNav = (barePath: string) =>
  !HIDDEN_PREFIXES.some((prefix) => barePath.startsWith(prefix)) &&
  !HIDDEN_ROUTES.has(barePath);

const BottomNavContainer = () => {
  const pathname = usePathname();

  const barePath = useMemo(() => stripLocale(pathname), [pathname]);

  if (!shouldRenderBottomNav(barePath)) {
    return null;
  }

  return <BottomNav />;
};

export default BottomNavContainer;
