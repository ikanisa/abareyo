import { PRODUCTS, type Product, type ProductBadge } from "../_data/products";

type SupabaseProduct = {
  id: string | null;
  name: string | null;
  category: string | null;
  price: number | null;
  description: string | null;
  image_url: string | null;
  badge: string | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();

const normalizeCategory = (category: string | null): Product["category"] | undefined => {
  if (!category) return undefined;
  const normalised = category.toLowerCase();
  if (
    normalised === "jersey" ||
    normalised === "jerseys" ||
    normalised === "kit" ||
    normalised === "kits"
  ) {
    return "jerseys";
  }
  if (normalised === "training") return "training";
  if (normalised === "lifestyle") return "lifestyle";
  if (normalised === "accessories" || normalised === "accessory") return "accessories";
  if (normalised === "bundle" || normalised === "bundles") return "bundles";
  return undefined;
};

const mapBadge = (badge: string | null): ProductBadge | undefined => {
  if (!badge) return undefined;
  const normalised = badge.toLowerCase();
  if (normalised === "official") return "official";
  if (normalised === "new") return "new";
  if (normalised === "sale" || normalised === "discount") return "sale";
  if (normalised === "limited" || normalised === "exclusive") return "limited";
  return undefined;
};

const mergeCatalog = (base: Product[], remote: SupabaseProduct[]): Product[] => {
  if (!remote.length) {
    return base;
  }

  const remoteBySlug = remote.reduce<Map<string, SupabaseProduct>>((accumulator, entry) => {
    const keySource = entry.name ?? entry.id ?? undefined;
    if (!keySource) return accumulator;
    const key = slugify(keySource);
    if (!key) return accumulator;
    accumulator.set(key, entry);
    return accumulator;
  }, new Map());

  return base.map((product) => {
    const remoteMatch = remoteBySlug.get(product.slug);
    if (!remoteMatch) {
      return product;
    }

    const price = typeof remoteMatch.price === "number" && Number.isFinite(remoteMatch.price)
      ? Number(remoteMatch.price)
      : undefined;

    const images = remoteMatch.image_url
      ? [
          {
            src: remoteMatch.image_url,
            alt: remoteMatch.name ?? product.images[0]?.alt ?? product.name,
          },
        ]
      : product.images;

    const badge = mapBadge(remoteMatch.badge);
    const badges = badge
      ? Array.from(new Set([...(product.badges ?? []), badge]))
      : product.badges;

    const category = normalizeCategory(remoteMatch.category) ?? product.category;

    return {
      ...product,
      id: remoteMatch.id ?? product.id,
      name: remoteMatch.name ?? product.name,
      description: remoteMatch.description ?? product.description,
      images,
      badges,
      category,
      variants:
        price != null
          ? product.variants.map((variant) => ({
              ...variant,
              price,
            }))
          : product.variants,
    } satisfies Product;
  });
};

const fetchRemoteProducts = async (): Promise<SupabaseProduct[]> => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";
  const endpoint = `${base}/api/shop/products`;

  try {
    const response = await fetch(endpoint, { next: { revalidate: 60 } });
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map((entry) => {
        if (!entry || typeof entry !== "object") return undefined;
        const record = entry as Record<string, unknown>;
        return {
          id: typeof record.id === "string" ? record.id : null,
          name: typeof record.name === "string" ? record.name : null,
          category: typeof record.category === "string" ? record.category : null,
          price: typeof record.price === "number" ? record.price : null,
          description: typeof record.description === "string" ? record.description : null,
          image_url: typeof record.image_url === "string" ? record.image_url : null,
          badge: typeof record.badge === "string" ? record.badge : null,
        } satisfies SupabaseProduct;
      })
      .filter((value): value is SupabaseProduct => Boolean(value));
  } catch (error) {
    console.error("Failed to fetch shop products", error);
    return [];
  }
};

export const fetchCatalogProducts = async (): Promise<Product[]> => {
  const remoteProducts = await fetchRemoteProducts();
  return mergeCatalog(PRODUCTS, remoteProducts);
};
