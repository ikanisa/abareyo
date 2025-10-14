import PageShell from "@/app/_components/shell/PageShell";
import { shopData } from "@/app/_data/shop_v2";
import MinimalCatalog from "./_components/MinimalCatalog";

export default function Shop() {
  const products = shopData.products.slice(0, 8);

  return (
    <PageShell>
      <section className="card">
        <h1>Official Shop</h1>
        <div className="muted">Kits, training, accessories—USSD checkout.</div>
      </section>
      <MinimalCatalog products={products} />
    </PageShell>
  );
}
