import PageShell from "@/app/_components/shell/PageShell";
import RewardsWidget from "@/app/_components/home/RewardsWidget";

export default function Home() {
  return (
    <PageShell>
      <section className="card">
        <h1>Rayon vs APR — Sat 18:00</h1>
        <p className="muted">Amahoro Stadium</p>
        <div className="mt-3 flex gap-2">
          <a className="btn-primary" href="/tickets">
            Buy Ticket
          </a>
          <a className="btn" href="/matches">
            Match Centre
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <a className="tile text-center" href="/tickets">
            🎟️ Tickets
          </a>
          <a className="tile text-center" href="/shop">
            🛍️ Shop
          </a>
          <a className="tile text-center" href="/services">
            🏦 Services
          </a>
          <a className="tile text-center" href="/more/rewards">
            ⭐ Rewards
          </a>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="card">
          <h2 className="section-title">What’s Next</h2>
          <div className="muted">Get a free Blue Ticket with an insurance policy.</div>
        </div>
        <div className="card">
          <h2 className="section-title">Savings Streak</h2>
          <div className="muted">Earn points with SACCO deposits via USSD.</div>
        </div>
      </section>

      <RewardsWidget />
    </PageShell>
  );
}
