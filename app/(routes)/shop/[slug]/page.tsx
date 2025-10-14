import PageShell from "@/app/_components/shell/PageShell";

export default function PDP() {
  const price = 25000;
  return (
    <PageShell>
      <section className="card">
        <div className="h-52 rounded-2xl bg-white/10 mb-3" />
        <h1>Home Jersey 24/25</h1>
        <div className="muted">Official merchandise</div>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {(["XS", "S", "M", "L", "XL", "XXL"] as const).map((size) => (
            <button key={size} className="tile text-center">
              {size}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <a
            className="btn-primary w-full inline-block text-center"
            href={`tel:*182*1*1*078xxxxxxx*${price}%23`}
          >
            Pay via USSD
          </a>
        </div>
      </section>
    </PageShell>
  );
}
