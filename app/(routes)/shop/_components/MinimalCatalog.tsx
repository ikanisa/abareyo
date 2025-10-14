import Link from "next/link";

import { formatCurrency, type Product } from "@/app/_data/shop_v2";

type CatalogProduct = Pick<
  Product,
  "id" | "name" | "slug" | "price" | "badges" | "category" | "images"
>;

type MinimalCatalogProps = {
  products: CatalogProduct[];
};

function getBadgeCopy(badges: CatalogProduct["badges"]) {
  if (!badges || badges.length === 0) return null;
  const label = badges[0];
  if (label === "official") return "Official";
  if (label === "new") return "New";
  if (label === "sale") return "Sale";
  if (label === "exclusive") return "Exclusive";
  return label;
}

export default function MinimalCatalog({ products }: MinimalCatalogProps) {
  if (!products.length) {
    return (
      <section className="card text-center">
        <div className="text-white/90 font-semibold">No products yet</div>
        <p className="muted text-sm mt-1">
          Visit again soon for the latest Gikundiro gear.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {products.map((product) => {
        const badge = getBadgeCopy(product.badges);
        const preview = product.images?.[0];
        return (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className="card block space-y-3"
            aria-label={`${product.name} — ${formatCurrency(product.price)}`}
          >
            <div className="relative h-36 rounded-2xl bg-white/10">
              {badge ? (
                <span className="tile absolute left-3 top-3 text-xs uppercase tracking-wide">
                  {badge}
                </span>
              ) : null}
              {preview ? (
                <span
                  className="absolute inset-0 rounded-2xl bg-cover bg-center opacity-80"
                  style={{ backgroundImage: `url(${preview})` }}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="space-y-1">
              <div className="text-white/90 font-semibold">{product.name}</div>
              <div className="muted text-xs">{product.category}</div>
              <div className="text-sm text-white">{formatCurrency(product.price)}</div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
