import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import ProductPurchase from "@/app/_components/shop/ProductPurchase";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { getProductBySlug } from "../_logic/serverShop";
import type { Color } from "../_data/products";

export const generateMetadata = ({ params }: { params: { slug: string } }) => {
  const product = getProductBySlug(params.slug);
  if (!product) {
    return buildRouteMetadata("/shop");
  }
  return buildRouteMetadata("/shop", {
    title: `${product.name} | Shop`,
    description: product.description,
  });
};

const colorTokens: Record<Color, string> = {
  blue: "#0047FF",
  white: "#FFFFFF",
  black: "#111827",
};

const ProductPage = ({ params }: { params: { slug: string } }) => {
  const product = getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const baseVariant = product.variants[0];
  if (!baseVariant) {
    notFound();
  }

  const colorKeys = Array.from(
    new Set<Color>(product.variants.map((variant) => variant.color)),
  );
  const colors = colorKeys.map((key) => colorTokens[key]);

  const heroImage = product.images[0]?.src;

  return (
    <PageShell>
      <section className="card space-y-4">
        <div
          className="aspect-[4/3] w-full rounded-2xl bg-white/10"
          style={
            heroImage
              ? {
                  backgroundImage: `url(${heroImage})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
          aria-label={heroImage ? undefined : "Product image placeholder"}
        />

        <div className="space-y-1">
          <h1>{product.name}</h1>
          <p className="muted text-sm">{product.description}</p>
        </div>

        <ProductPurchase
          productId={product.id}
          price={baseVariant.price}
          colors={colors}
          variants={product.variants}
        />

        <div className="space-y-2 rounded-2xl bg-white/10 p-3 text-xs text-white/80">
          {product.materials ? (
            <p>
              <span className="font-semibold text-white">Materials:</span> {product.materials}
            </p>
          ) : null}
          {product.care ? (
            <p>
              <span className="font-semibold text-white">Care:</span> {product.care}
            </p>
          ) : null}
          {product.shipping ? (
            <p>
              <span className="font-semibold text-white">Shipping:</span> {product.shipping}
            </p>
          ) : null}
          {product.returnPolicy ? (
            <p>
              <span className="font-semibold text-white">Returns:</span> {product.returnPolicy}
            </p>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
};

export default ProductPage;
