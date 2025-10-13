import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PdpClientPage from "./PdpClientPage";
import { fetchCatalogProducts } from "../_lib/catalog";
import type { ShopLocale } from "../_hooks/useShopLocale";

const PDPPage = async ({ params }: { params: { slug: string } }) => {
  const catalog = await fetchCatalogProducts();
  const product = catalog.find((entry) => entry.slug === params.slug);
  if (!product) {
    notFound();
  }
  const localeCookie = cookies().get("abareyo:shop-locale")?.value;
  const initialLocale: ShopLocale = localeCookie === "rw" ? "rw" : "en";
  return <PdpClientPage product={product} initialLocale={initialLocale} initialProducts={catalog} />;
};

export default PDPPage;
