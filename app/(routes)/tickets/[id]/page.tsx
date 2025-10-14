import PageShell from "@/app/_components/shell/PageShell";

export default function TicketPDP() {
  const price = 5000;
  return (
    <PageShell>
      <section className="card">
        <h1>Rayon vs APR</h1>
        <div className="muted">Amahoro • Sat 18:00</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["VIP", "Regular", "Blue"] as const).map((zone) => (
            <button key={zone} className="tile text-center">
              {zone}
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
          <p className="muted text-xs mt-2">
            On iOS, copy USSD if dial does not open.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
