import PageShell from '@/app/_components/shell/PageShell';
import WalletPasses from './_components/WalletPasses';
export const dynamic = 'force-dynamic';
export default async function WalletPage(){
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL||''}/api/passes`, { cache:'no-store' }).catch(()=>null);
  const j = await res?.json().catch(()=>null);
  const passes = j?.passes || [];
  return (
    <PageShell>
      <section className="card">
        <h1>Wallet & Passes</h1>
        <p className="muted">Your active tickets and history.</p>
      </section>
      <WalletPasses items={passes}/>
    </PageShell>
  );
}
