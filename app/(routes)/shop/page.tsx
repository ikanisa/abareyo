import { cookies } from "next/headers";

import { buildRouteMetadata } from "@/app/_lib/navigation";

import ShopClientPage from "./ShopClientPage";
import type { ShopLocale } from "./_hooks/useShopLocale";

export const metadata = buildRouteMetadata("/shop");

const ShopPage = () => {
  const localeCookie = cookies().get("abareyo:shop-locale")?.value;
  const initialLocale: ShopLocale = localeCookie === "rw" ? "rw" : "en";
  return <ShopClientPage initialLocale={initialLocale} />;
};

export default ShopPage;
