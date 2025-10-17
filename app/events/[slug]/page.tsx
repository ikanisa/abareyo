import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { eventsSchedule } from "@/app/_config/home";

type EventPageProps = {
  params: { slug: string };
};

const formatDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const EventDetailPage = ({ params }: EventPageProps) => {
  const event = eventsSchedule.find((entry) => entry.href.replace("/events/", "") === params.slug);
  if (!event) {
    notFound();
  }

  return (
    <PageShell>
      <SubpageHeader
        title={event.title}
        eyebrow="Club event"
        description={event.description ?? "Join fellow Rayon Nation supporters for a special gathering."}
        backHref="/events"
        actions={
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
            {formatDate.format(new Date(event.date))}
          </span>
        }
      />
      <section className="glass rounded-3xl border border-white/10 px-6 py-5 text-white">
        <div className="space-y-4 text-white/80">
          <p>
            <strong className="font-semibold text-white">Location:</strong> {event.location}
          </p>
          <p>
            This event is part of our fan engagement series. Expect live entertainment, merch pop-ups, and exclusive
            interviews with club legends. Tap the Community section to register your attendance and secure priority access.
          </p>
        </div>
      </section>
    </PageShell>
  );
};

export default EventDetailPage;
