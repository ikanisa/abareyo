import PageShell from "@/app/_components/shell/PageShell";
import ShopCatalog from "@/app/_components/shop/ShopCatalog";
import { products } from "@/app/_data/shop_v2";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/shop");

const ShopPage = async () => {
  return (
    <PageShell>
      <section className="card space-y-2">
        <div>
          <h1>Official Shop</h1>
          <p className="muted">Kits, training gear, and accessories — checkout via USSD.</p>
        </div>
      </section>
      <ShopCatalog products={products} />
    </PageShell>
  );
};

export default ShopPage;
