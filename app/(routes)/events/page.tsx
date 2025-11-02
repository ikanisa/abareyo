import Link from "next/link";
import { cache } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { buildBackendUrl } from "../_lib/backend-url";

export const dynamic = "force-dynamic";
export const metadata = buildRouteMetadata("/events", {
  title: "Club events",
  description: "Track Rayon Sports activations, fan trips, and premium matchday experiences.",
});

type EventSummary = {
  id: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  description: string | null;
  capacity: number | null;
  rsvpCount: number | null;
  price: string | null;
  tags: string[];
};

type EventsListing = {
  events: EventSummary[];
  total: number | null;
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
};

const toNumberValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(toStringValue).filter((item): item is string => Boolean(item));
  }
  const single = toStringValue(value);
  if (single) {
    return [single];
  }
  return [];
};

const mapEventSummary = (payload: unknown): EventSummary | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const id =
    toStringValue(record.id) ||
    toStringValue(record.eventId) ||
    toStringValue(record.slug) ||
    toStringValue(record.identifier);
  const title = toStringValue(record.title) || toStringValue(record.name);

  if (!id || !title) {
    return null;
  }

  const startsAt =
    toStringValue(record.startsAt) ||
    toStringValue(record.startAt) ||
    toStringValue(record.date) ||
    toStringValue(record.startTime);

  return {
    id,
    title,
    startsAt,
    location:
      toStringValue(record.location) ||
      toStringValue(record.venue) ||
      toStringValue(record.city) ||
      toStringValue(record.region),
    description:
      toStringValue(record.description) ||
      toStringValue(record.summary) ||
      toStringValue(record.teaser),
    capacity:
      toNumberValue(record.capacity) ??
      toNumberValue(record.limit) ??
      toNumberValue(record.availableSeats) ??
      null,
    rsvpCount:
      toNumberValue(record.rsvpCount) ??
      toNumberValue(record.attending) ??
      toNumberValue(record.registrations) ??
      null,
    price:
      toStringValue(record.price) ||
      toStringValue(record.cost) ||
      toStringValue(record.ticketPrice),
    tags: toStringArray(record.tags ?? record.categories ?? record.labels),
  };
};

const parseEventsResponse = (payload: unknown): EventsListing => {
  if (!payload || typeof payload !== "object") {
    return { events: [], total: null };
  }

  const root = payload as Record<string, unknown>;
  const data =
    (typeof root.data === "object" && root.data !== null ? (root.data as Record<string, unknown>) : null) ?? root;

  const collectionSource = Array.isArray(data)
    ? data
    : Array.isArray(data.events)
      ? data.events
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.results)
          ? data.results
          : [];

  const events = collectionSource
    .map((item) => mapEventSummary(item))
    .filter((item): item is EventSummary => Boolean(item));

  const total =
    toNumberValue((data as Record<string, unknown>).total) ??
    toNumberValue((data as Record<string, unknown>).count) ??
    toNumberValue(root.total) ??
    (events.length ? events.length : null);

  return { events, total };
};

const fetchEventsDirectory = cache(async (): Promise<EventsListing> => {
  try {
    const response = await fetch(buildBackendUrl("/events"), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events (${response.status})`);
    }

    const payload = await response.json();
    return parseEventsResponse(payload);
  } catch (error) {
    console.error("Unable to load events", error);
    return { events: [], total: null };
  }
});

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Schedule shared soon";
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const formatCapacity = (capacity: number | null, rsvpCount: number | null) => {
  if (typeof capacity === "number" && Number.isFinite(capacity)) {
    const used = typeof rsvpCount === "number" && Number.isFinite(rsvpCount) ? rsvpCount : null;
    if (used !== null) {
      const remaining = Math.max(capacity - used, 0);
      return `${remaining.toLocaleString()} of ${capacity.toLocaleString()} spots left`;
    }
    return `${capacity.toLocaleString()} seats`;
  }
  return "Capacity shared soon";
};

const EventsGrid = ({ events }: { events: EventSummary[] }) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Club events" role="list">
    {events.map((event) => (
      <article
        key={event.id}
        className="tile flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/15 bg-white/10 p-5"
        role="listitem"
        aria-labelledby={`event-${event.id}-title`}
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">{formatDateTime(event.startsAt)}</p>
          <h2 id={`event-${event.id}-title`} className="text-xl font-semibold text-white">
            {event.title}
          </h2>
          <p className="text-sm text-white/75">{event.description ?? "Event details coming soon."}</p>
        </div>
        <div className="space-y-2 text-sm text-white/75">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1">{event.location ?? "Location TBC"}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{formatCapacity(event.capacity, event.rsvpCount)}</span>
          </div>
          {event.tags.length ? (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-white/60">
              {event.tags.map((tag) => (
                <span key={`${event.id}-${tag}`} className="rounded-full bg-white/10 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {event.price ? <p className="text-xs uppercase tracking-[0.24em] text-white/60">{event.price}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/events/${event.id}`}
            className="btn min-h-[44px] flex-1 justify-center bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label={`View details for ${event.title}`}
          >
            View details
          </Link>
          <Link
            href="/tickets"
            className="btn-secondary min-h-[44px] flex-1 justify-center"
            aria-label="Open tickets"
          >
            Tickets
          </Link>
        </div>
      </article>
    ))}
  </section>
);

const EmptyState = () => (
  <section className="card space-y-3 text-center" role="status">
    <h2 className="text-xl font-semibold text-white">Club events are on pause</h2>
    <p className="muted text-sm">
      New meet-ups and activations will appear here once confirmed. Follow Rayon Sports channels for realtime updates.
    </p>
    <Link href="/community" className="btn-primary mx-auto mt-2 min-h-[44px] px-6">
      Explore community missions
    </Link>
  </section>
);

export default async function EventsPage() {
  const { events, total } = await fetchEventsDirectory();
  const totalLabel = typeof total === "number" && Number.isFinite(total) ? `${total.toLocaleString()} events` : null;

  return (
    <PageShell>
      <SubpageHeader
        title="Club Events"
        eyebrow="Calendar"
        description="Fan trips, watch parties, and partner activations curated for Rayon Nation."
        backHref="/more"
        actions={
          totalLabel ? (
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              {totalLabel}
            </span>
          ) : undefined
        }
      />

      {events.length ? <EventsGrid events={events} /> : <EmptyState />}
    </PageShell>
  );
}
