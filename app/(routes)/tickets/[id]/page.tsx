import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import UssdPayButton from "@/app/_components/payments/UssdPayButton";

import TicketZoneSelector from "./_components/TicketZoneSelector";

type MatchZone = {
  zone: string;
  price: number;
  capacity: number;
  remaining: number;
  gate?: string;
};

type MatchDetail = {
  id: string;
  opponent: string;
  home?: string;
  away?: string;
  venue?: string;
  kickoff?: string;
  status?: string;
  zones?: MatchZone[];
};

async function fetchMatch(id: string): Promise<MatchDetail | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/matches/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { match?: MatchDetail };
    return payload.match ?? null;
  } catch (error) {
    console.warn("Failed to load match", error);
    return null;
  }
}

export default async function TicketPDP({ params }: { params: { id: string } }) {
  const match = await fetchMatch(params.id);

  if (!match) {
    return (
      <PageShell>
        <section className="card text-center">
          <h1 className="text-lg font-semibold text-white">Match not found</h1>
          <p className="muted text-sm mt-2">We could not find that fixture. Check back soon.</p>
        </section>
      </PageShell>
    );
  }

  const title = `${match.home ?? "Rayon Sports"} vs ${match.away ?? match.opponent ?? "Opponent"}`;
  const zones = match.zones ?? [];

  return (
    <PageShell>
      <SubpageHeader
        title={title}
        eyebrow="Ticket checkout"
        description="Pick your zone and dial the USSD code to complete payment."
        backHref="/tickets"
      />
      <section className="card space-y-5">
        <div className="space-y-2">
          <p className="text-white/80 text-sm">{match.venue ?? "Venue TBC"}</p>
          <p className="muted text-xs">
            {match.kickoff ? new Date(match.kickoff).toLocaleString() : "Kick-off TBC"}
          </p>
        </div>

        <TicketZoneSelector zones={zones} renderPay={(amount) => <UssdPayButton amount={amount} />} />
      </section>
    </PageShell>
  );
}
