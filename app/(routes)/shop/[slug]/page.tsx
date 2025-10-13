import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PdpClientPage from "./PdpClientPage";
import { getProductBySlug } from "../_logic/serverShop";
import type { ShopLocale } from "../_hooks/useShopLocale";

const PDPPage = ({ params }: { params: { slug: string } }) => {
  const product = getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  const localeCookie = cookies().get("gikundiro:shop-locale")?.value;
  const initialLocale: ShopLocale = localeCookie === "rw" ? "rw" : "en";
  return <PdpClientPage product={product} initialLocale={initialLocale} />;
};

export default PDPPage;
