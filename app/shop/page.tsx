import { buildRouteMetadata } from "@/app/_lib/navigation";
import { shopData, type Product } from "@/app/_data/shop_v2";

import ShopExperience from "./ShopExperience";

export const metadata = buildRouteMetadata("/shop");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();

type SupabaseProduct = {
  id: string;
  name: string | null;
  category: string | null;
  price: number | null;
  description: string | null;
  image_url: string | null;
  badge: string | null;
};

const mapRemoteProduct = (record: SupabaseProduct): Product => {
  const fallbackImage = "/shop/home1.png";
  return {
    id: record.id,
    name: record.name ?? "Rayon Merch",
    slug: slugify(record.name ?? record.id ?? "product"),
    images: record.image_url ? [record.image_url] : [fallbackImage],
    price: Number(record.price) || 0,
    badges: record.badge ? [record.badge as Product["badges"][number]] : undefined,
    description: record.description ?? undefined,
    category:
      typeof record.category === "string"
        ? record.category.charAt(0).toUpperCase() + record.category.slice(1)
        : "Accessories",
  } satisfies Product;
};

const fetchProducts = async (): Promise<Product[]> => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";
  const endpoint = `${base}/api/shop/products`;
  try {
    const response = await fetch(endpoint, { next: { revalidate: 60 } });
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as SupabaseProduct[] | unknown;
    if (!Array.isArray(payload)) {
      return [];
    }
    return payload.map((entry) => mapRemoteProduct(entry as SupabaseProduct));
  } catch (error) {
    console.error("Failed to fetch shop products", error);
    return [];
  }
};

const ShopPage = async () => {
  const remoteProducts = await fetchProducts();
  const mergedData = {
    ...shopData,
    products: remoteProducts.length ? remoteProducts : shopData.products,
  };
  return <ShopExperience data={mergedData} />;
};

export default ShopPage;
