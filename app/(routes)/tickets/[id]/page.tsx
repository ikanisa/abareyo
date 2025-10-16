import PageShell from '@/app/_components/shell/PageShell';
import UssdPayButton from '@/app/_components/payments/UssdPayButton';

export default async function TicketPDP({ params }:{ params:{ id:string } }){
  // Fetch minimal match / pricing here if available (server-side). For MVP, static example:
  const price = 5000;
  return (
    <PageShell>
      <section className="card">
        <h1>Rayon vs APR</h1>
        <div className="muted">Amahoro • Sat 18:00</div>

        <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Zone">
          {['VIP','Regular','Blue'].map(z=><button key={z} className="tile text-center" role="radio" aria-checked={z==='Blue'}>{z}</button>)}
        </div>

        <div className="mt-4">
          <UssdPayButton amount={price} />
        </div>
      </section>
    </PageShell>
  );
}
