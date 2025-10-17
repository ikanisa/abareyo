import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { shopData } from "@/app/_data/shop_v2";
import MinimalCatalog from "./_components/MinimalCatalog";

export default function Shop() {
  const products = shopData.products.slice(0, 8);

  return (
    <PageShell>
      <SubpageHeader
        title="Official Shop"
        eyebrow="Merchandise"
        description="Browse the latest kits, training gear, and accessories with instant checkout."
        backHref="/"
      />
      <MinimalCatalog products={products} />
    </PageShell>
  );
}
