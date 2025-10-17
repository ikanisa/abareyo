import Link from "next/link";

import { buildRouteMetadata } from "@/app/_lib/navigation";
import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { eventsSchedule } from "@/app/_config/home";

export const metadata = buildRouteMetadata("/events");

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const EventsPage = () => (
  <PageShell>
    <SubpageHeader
      title="Club Events"
      eyebrow="Calendar"
      description="Track Rayon Sports appearances, fan festivals, and premium experiences across the season."
      backHref="/"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
          {eventsSchedule.length} upcoming
        </span>
      }
    />

    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {eventsSchedule.map((event) => (
        <article
          key={event.id}
          className="tile flex h-48 flex-col justify-between border border-white/15 bg-white/10 p-5 text-left"
          aria-label={event.title}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">{formatDate(event.date)}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{event.title}</h2>
            <p className="mt-2 text-sm text-white/75">
              {event.description ?? "Club activation hosted by Rayon Sports partners."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 text-sm text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1">{event.location}</span>
            <Link className="rounded-full bg-white/15 px-3 py-1 text-white" href="/tickets">
              Secure tickets
            </Link>
          </div>
        </article>
      ))}
    </section>
  </PageShell>
);

export default EventsPage;
