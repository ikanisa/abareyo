import PageShell from '@/app/_components/shell/PageShell';
export default async function MorePage(){
  // Fetch minimal profile if needed in future; for now static shell
  return (
    <PageShell>
      <section className="card">
        <h1>My Profile</h1>
        <p className="muted">Manage passes, rewards, and settings.</p>
      </section>

      <section className="grid gap-3">
        <a className="tile" href="/more/wallet">💼 Wallet & Passes</a>
        <a className="tile" href="/more/rewards">⭐ Rewards</a>
        <a className="tile" href="/services">🏦 Insurance & Savings</a>
        <a className="tile" href="/more/settings">⚙️ Settings</a>
      </section>
    </PageShell>
  );
}
