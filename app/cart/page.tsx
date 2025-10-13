import { cookies } from "next/headers";

import CartClientPage from "./CartClientPage";
import type { ShopLocale } from "@/app/(routes)/shop/_hooks/useShopLocale";

const CartPage = () => {
  const localeCookie = cookies().get("abareyo:shop-locale")?.value;
  const initialLocale: ShopLocale = localeCookie === "rw" ? "rw" : "en";
  return <CartClientPage initialLocale={initialLocale} />;
};

export default CartPage;
