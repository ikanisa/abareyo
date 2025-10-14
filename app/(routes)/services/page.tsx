import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/services");

const ServicesPage = async () => {
  return (
    <PageShell>
      <section className="card space-y-3">
        <div>
          <h1>Partner Services</h1>
          <p className="muted">Insurance and savings wizards open in quick sheets.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/services/insurance" className="tile">
            🚗 Insurance
          </Link>
          <Link href="/services/savings" className="tile">
            🏦 Savings
          </Link>
        </div>
      </section>
    </PageShell>
  );
};

export default ServicesPage;
