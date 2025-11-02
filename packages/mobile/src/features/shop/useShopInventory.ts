import { useQuery } from "@tanstack/react-query";

import { useSupabase } from "@/api";

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  badge?: string;
  image?: string;
  description: string;
};

const FALLBACK_PRODUCTS: ShopProduct[] = [
  {
    id: "home-kit",
    slug: "home-kit",
    name: "2025 Home Kit",
    price: 68000,
    badge: "New",
    image: "https://assets.gikundiro.rw/kits/2025-home.png",
    description: "Classic royal blue with subtle lightning trim and breathable panels.",
  },
  {
    id: "away-kit",
    slug: "away-kit",
    name: "2025 Away Kit",
    price: 65000,
    badge: "Limited",
    image: "https://assets.gikundiro.rw/kits/2025-away.png",
    description: "White base with navy sash celebrating continental nights.",
  },
  {
    id: "heritage-scarf",
    slug: "heritage-scarf",
    name: "Heritage Scarf",
    price: 25000,
    description: "Soft-knit scarf with the Rayon Sports crest and anthem lyrics.",
  },
];

export function useShopInventory() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["shop-inventory"],
    queryFn: async (): Promise<ShopProduct[]> => {
      if (!supabase) {
        return FALLBACK_PRODUCTS;
      }

      const { data, error } = await supabase
        .from("shop_inventory")
        .select("id, slug, name, price, badge, image, description")
        .order("price", { ascending: true });

      if (error || !data?.length) {
        if (error) {
          console.warn("[shop] Falling back to static inventory", error.message);
        }
        return FALLBACK_PRODUCTS;
      }

      return data.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        badge: item.badge ?? undefined,
        image: item.image ?? undefined,
        description: item.description ?? "",
      }));
    },
    initialData: FALLBACK_PRODUCTS,
    staleTime: 10 * 60 * 1000,
  });
}

export function findProductBySlug(products: ShopProduct[], slug: string) {
  return products.find((product) => product.slug === slug);
}
