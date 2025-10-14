import { matches as fallbackMatches } from "@/app/_data/matches";
import PageShell from "@/app/_components/shell/PageShell";
import { buildBackendUrl } from "@/app/(routes)/_lib/backend-url";

import WalletPasses from "./_components/WalletPasses";

export const dynamic = "force-dynamic";

type PassRecord = {
  id: string;
  order_id: string | null;
  zone: string;
  gate: string;
  state: string;
  match?: {
    id?: string;
    opponent?: string;
    kickoff?: string;
  };
};

type PassesResponse = {
  passes?: unknown;
};

const buildFallbackPasses = (): PassRecord[] =>
  fallbackMatches.slice(0, 3).map((match, index) => {
    const home = typeof match.home === "string" ? match.home : "";
    const away = typeof match.away === "string" ? match.away : "";
    const opponent = home.toLowerCase().includes("rayon")
      ? away
      : home || away || "Opponent";

    return {
      id: `pass-${match.id ?? index}`,
      order_id: index === 0 ? `order-${index + 101}` : null,
      zone: index === 1 ? "BLUE" : "VIP",
      gate: ["A", "C", "B"][index % 3],
      state: index === 2 ? "used" : "active",
      match: {
        id: typeof match.id === "string" ? match.id : undefined,
        opponent,
        kickoff: typeof match.kickoff === "string" ? match.kickoff : undefined,
      },
    } satisfies PassRecord;
  });

export default async function WalletPage() {
  let passesPayload: PassesResponse | null = null;

  try {
    const response = await fetch(buildBackendUrl("/api/passes"), { cache: "no-store" });
    if (response.ok) {
      passesPayload = (await response.json()) as PassesResponse;
    }
  } catch (error) {
    console.warn("Failed to fetch wallet passes, falling back to fixtures", error);
  }

  const passes = Array.isArray(passesPayload?.passes)
    ? (passesPayload.passes as PassRecord[])
    : buildFallbackPasses();

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
