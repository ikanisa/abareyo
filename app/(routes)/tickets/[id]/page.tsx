import PageShell from "@/app/_components/shell/PageShell";
import UssdPayButton from "@/app/_components/payments/UssdPayButton";

export default function TicketPDP({ params }: { params: { id: string } }) {
  const price = 5000;

  return (
    <PageShell>
      <section className="card" data-match-id={params.id}>
        <h1>Rayon vs APR</h1>
        <div className="muted">Amahoro • Sat 18:00</div>

        <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Zone">
          {["VIP", "Regular", "Blue"].map((zone) => (
            <button key={zone} className="tile text-center" role="radio" aria-checked={zone === "Blue"}>
              {zone}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <UssdPayButton amount={price} />
        </div>
      </section>
    </PageShell>
  );
}
