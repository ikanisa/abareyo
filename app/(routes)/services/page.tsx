import PageShell from "@/app/_components/shell/PageShell";
import { ff } from "@/lib/flags";

export default function Services() {
  if (!ff("services.webviews", true)) {
    return (
      <PageShell>
        <section className="card">
          <h1>Services</h1>
          <p className="muted">Coming soon.</p>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="card">
        <h1>Partner Services</h1>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <a className="tile text-center" href="/services/insurance">
            🚗 Insurance
          </a>
          <a className="tile text-center" href="/services/savings">
            🏦 Savings
          </a>
        </div>
      </section>
    </PageShell>
  );
}
