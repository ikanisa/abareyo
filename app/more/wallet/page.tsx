import PageShell from "@/app/_components/shell/PageShell";
import WalletPasses from "./_components/WalletPasses";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/passes`;
  const res = await fetch(endpoint, { cache: "no-store" }).catch(() => null);
  const data = await res?.json().catch(() => null);
  const passes = Array.isArray(data?.passes) ? data.passes : [];

  return (
    <PageShell>
      <section className="card">
        <h1>Wallet &amp; Passes</h1>
        <p className="muted">Your active tickets and history.</p>
      </section>
      <WalletPasses items={passes} />
    </PageShell>
  );
}
