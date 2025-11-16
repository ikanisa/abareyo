"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/app/_components/shell/BottomNav";

const LOCALE_PREFIX = /^\/(en|fr|rw)(?=\/|$)/;
const HIDDEN_PREFIXES = ["/api"];

const shouldRenderBottomNav = (barePath: string) =>
  !HIDDEN_PREFIXES.some((prefix) => barePath.startsWith(prefix));

const BottomNavContainer = () => {
  const pathname = usePathname();
  const match = pathname?.match(LOCALE_PREFIX);
  const localePrefix = match?.[0] ?? "";
  const barePath = (pathname ?? "/").replace(LOCALE_PREFIX, "") || "/";

  if (!shouldRenderBottomNav(barePath)) {
    return null;
  }

  return <BottomNav localePrefix={localePrefix} activePath={barePath} />;
};

export default BottomNavContainer;
