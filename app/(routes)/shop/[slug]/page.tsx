import PageShell from '@/app/_components/shell/PageShell';
import UssdPayButton from '@/app/_components/payments/UssdPayButton';

export default async function PDP({ params }:{ params:{ slug:string } }){
  // Load product by slug here (server-side). For MVP, static example:
  const price = 25000;
  return (
    <PageShell>
      <section className="card">
        <div className="h-52 rounded-2xl bg-white/10 mb-3" />
        <h1>Home Jersey 24/25</h1>
        <div className="muted">Official merchandise</div>

        <div className="mt-2 grid grid-cols-6 gap-2" role="radiogroup" aria-label="Size">
          {['XS','S','M','L','XL','XXL'].map(s=><button key={s} className="tile text-center" role="radio" aria-checked={s==='M'}>{s}</button>)}
        </div>

        <div className="mt-4">
          <UssdPayButton amount={price} />
        </div>
      </section>
    </PageShell>
  );
}
