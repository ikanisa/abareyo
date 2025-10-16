"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/app/_components/shell/BottomNav";

const HIDDEN_PREFIXES = ["/admin", "/api"];
const HIDDEN_ROUTES = new Set(["/admin/login"]);

const shouldRenderBottomNav = (path: string) =>
  !HIDDEN_PREFIXES.some((prefix) => path.startsWith(prefix)) && !HIDDEN_ROUTES.has(path);

const BottomNavContainer = () => {
  const pathname = usePathname() ?? "/";

  if (!shouldRenderBottomNav(pathname)) {
    return null;
  }

  return <BottomNav />;
};

export default BottomNavContainer;
