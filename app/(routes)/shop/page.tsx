import { cookies } from "next/headers";

import { buildRouteMetadata } from "@/app/_lib/navigation";

import ShopClientPage from "./ShopClientPage";
import { fetchCatalogProducts } from "./_lib/catalog";
import type { ShopLocale } from "./_hooks/useShopLocale";

export const metadata = buildRouteMetadata("/shop");

const ShopPage = async () => {
  const localeCookie = cookies().get("abareyo:shop-locale")?.value;
  const initialLocale: ShopLocale = localeCookie === "rw" ? "rw" : "en";
  const catalog = await fetchCatalogProducts();
  return <ShopClientPage initialLocale={initialLocale} initialProducts={catalog} />;
};

export default ShopPage;
