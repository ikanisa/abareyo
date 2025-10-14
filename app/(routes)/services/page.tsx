import PageShell from "@/app/_components/shell/PageShell";

export default function Services() {
  return (
    <PageShell>
      <section className="card">
        <h1>Partner Services</h1>
        <div className="grid grid-cols-2 gap-3 mt-3">
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
