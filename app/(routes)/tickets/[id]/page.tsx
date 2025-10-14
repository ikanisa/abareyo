import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import ZoneSelector from "@/app/_components/tickets/ZoneSelector";
import { fixtures } from "@/app/_data/fixtures";

type TicketParams = {
  params: { id: string };
};

const getFixture = (id: string) => fixtures.find((fixture) => fixture.id === id);

export const generateMetadata = ({ params }: TicketParams) => {
  const fixture = getFixture(params.id);
  if (!fixture) {
    return {};
  }
  return {
    title: `${fixture.title} | Tickets`,
    description: `${fixture.comp} at ${fixture.venue}`,
  };
};

const TicketPage = ({ params }: TicketParams) => {
  const fixture = getFixture(params.id);
  if (!fixture) {
    notFound();
  }

  const zones = fixture.zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    price: zone.price,
  }));

  return (
    <PageShell>
      <section className="card space-y-3">
        <div>
          <h1>{fixture.title}</h1>
          <p className="muted">
            {fixture.venue} • {fixture.date} {fixture.time}
          </p>
        </div>
        <ZoneSelector zones={zones} matchId={fixture.id} />
      </section>
    </PageShell>
  );
};

export default TicketPage;
