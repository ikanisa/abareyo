import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import Empty from "@/app/_components/common/Empty";
import { fixtures } from "@/app/_data/fixtures";
import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/tickets");

const upcomingFixtures = fixtures.filter((fixture) => fixture.status === "upcoming");

const Tickets = async () => {
  return (
    <PageShell>
      <section className="card space-y-2">
        <div>
          <h1>Upcoming Matches</h1>
          <p className="muted">Choose your zone and pay instantly via USSD.</p>
        </div>
      </section>
      <section className="space-y-3">
        {upcomingFixtures.length === 0 ? (
          <Empty title="No upcoming fixtures" desc="Check back soon for new matches." />
        ) : (
          upcomingFixtures.map((fixture) => (
            <Link key={fixture.id} href={`/tickets/${fixture.id}`} className="card block space-y-1">
              <h2 className="section-title">{fixture.title}</h2>
              <p className="muted text-sm">
                {fixture.date} • {fixture.time}
              </p>
              <p className="muted text-xs">{fixture.venue}</p>
            </Link>
          ))
        )}
      </section>
    </PageShell>
  );
};

export default Tickets;
