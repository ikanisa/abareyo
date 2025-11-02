import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { buildBackendUrl } from "../../_lib/backend-url";

import RsvpButton from "./RsvpButton";

type EventContact = {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};

type EventHost = {
  name: string | null;
  role: string | null;
};

type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  address: string | null;
  price: string | null;
  capacity: number | null;
  rsvpCount: number | null;
  tags: string[];
  agenda: string[];
  heroImage: string | null;
  joinInstructions: string | null;
  contact: EventContact;
  host: EventHost;
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
  const asString = toStringValue(value);
  if (asString) {
    return asString
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseEventDetail = (payload: unknown): EventDetail | null => {
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

  const heroImage =
    toStringValue(record.heroImage) ||
    toStringValue(record.heroImageUrl) ||
    toStringValue(record.bannerImage) ||
    toStringValue(record.coverImage) ||
    toStringValue(record.imageUrl);

  const contactPayload =
    typeof record.contact === "object" && record.contact !== null
      ? record.contact
      : {
          name: toStringValue(record.contactName),
          phone: toStringValue(record.contactPhone),
          whatsapp: toStringValue(record.contactWhatsapp),
          email: toStringValue(record.contactEmail),
        };

  const hostPayload =
    typeof record.host === "object" && record.host !== null
      ? record.host
      : {
          name: toStringValue(record.hostName) || toStringValue(record.organizer),
          role: toStringValue(record.hostRole) || toStringValue(record.organizerRole),
        };

  return {
    id,
    title,
    description:
      toStringValue(record.description) ||
      toStringValue(record.summary) ||
      toStringValue(record.teaser) ||
      "Club staff are preparing the briefing.",
    startsAt:
      toStringValue(record.startsAt) ||
      toStringValue(record.startAt) ||
      toStringValue(record.date) ||
      toStringValue(record.startTime),
    endsAt: toStringValue(record.endsAt) || toStringValue(record.endAt) || toStringValue(record.endTime),
    location:
      toStringValue(record.location) ||
      toStringValue(record.venue) ||
      toStringValue(record.city) ||
      toStringValue(record.region),
    address: toStringValue(record.address) || toStringValue(record.locationDetails),
    price:
      toStringValue(record.price) ||
      toStringValue(record.cost) ||
      toStringValue(record.ticketPrice) ||
      null,
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
    tags: toStringArray(record.tags ?? record.categories ?? record.labels ?? []),
    agenda:
      toStringArray(record.agenda) ||
      toStringArray(record.schedule) ||
      (toStringValue(record.programme) ? [toStringValue(record.programme)!] : []),
    heroImage,
    joinInstructions:
      toStringValue(record.instructions) ||
      toStringValue(record.joinInstructions) ||
      toStringValue(record.registrationNotes),
    contact: {
      name:
        toStringValue((contactPayload as Record<string, unknown>).name) ||
        toStringValue((contactPayload as Record<string, unknown>).lead),
      phone:
        toStringValue((contactPayload as Record<string, unknown>).phone) ||
        toStringValue((contactPayload as Record<string, unknown>).phoneNumber),
      whatsapp:
        toStringValue((contactPayload as Record<string, unknown>).whatsapp) ||
        toStringValue((contactPayload as Record<string, unknown>).whatsappNumber) ||
        toStringValue((contactPayload as Record<string, unknown>).phone),
      email: toStringValue((contactPayload as Record<string, unknown>).email),
    },
    host: {
      name: toStringValue((hostPayload as Record<string, unknown>).name),
      role: toStringValue((hostPayload as Record<string, unknown>).role),
    },
  };
};

const fetchEventDetail = cache(async (id: string): Promise<EventDetail | null> => {
  try {
    const response = await fetch(buildBackendUrl(`/events/${encodeURIComponent(id)}`), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch event (${response.status})`);
    }

    const payload = await response.json();
    if (payload && typeof payload === "object") {
      const root = payload as Record<string, unknown>;
      const data =
        (typeof root.data === "object" && root.data !== null ? (root.data as Record<string, unknown>) : null) ?? root;
      return parseEventDetail(data);
    }
    return parseEventDetail(payload);
  } catch (error) {
    console.error(`Unable to load event ${id}`, error);
    return null;
  }
});

const formatDateTime = (value: string | null, options: Intl.DateTimeFormatOptions = {}) => {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    ...options,
  });
  return formatter.format(new Date(timestamp));
};

const formatCapacity = (capacity: number | null, rsvpCount: number | null) => {
  if (typeof capacity === "number" && Number.isFinite(capacity)) {
    if (typeof rsvpCount === "number" && Number.isFinite(rsvpCount)) {
      const remaining = Math.max(capacity - rsvpCount, 0);
      return `${remaining.toLocaleString()} of ${capacity.toLocaleString()} spots left`;
    }
    return `${capacity.toLocaleString()} seats available`;
  }
  return "Capacity shared soon";
};

const ContactBlock = ({ contact }: { contact: EventContact }) => {
  if (!contact.name && !contact.phone && !contact.whatsapp && !contact.email) {
    return (
      <p className="muted text-sm">
        Event staff will publish contact details soon. RSVP to receive automated updates.
      </p>
    );
  }

  return (
    <dl className="space-y-2 text-sm text-white/80">
      {contact.name ? (
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Coordinator</dt>
          <dd>{contact.name}</dd>
        </div>
      ) : null}
      {contact.phone ? (
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Phone</dt>
          <dd>
            <a href={`tel:${contact.phone}`} className="underline decoration-white/40 decoration-dotted underline-offset-4">
              {contact.phone}
            </a>
          </dd>
        </div>
      ) : null}
      {contact.whatsapp ? (
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-white/60">WhatsApp</dt>
          <dd>
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/[^\d+]/g, "")}`}
              className="underline decoration-white/40 decoration-dotted underline-offset-4"
            >
              {contact.whatsapp}
            </a>
          </dd>
        </div>
      ) : null}
      {contact.email ? (
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Email</dt>
          <dd>
            <a href={`mailto:${contact.email}`} className="underline decoration-white/40 decoration-dotted underline-offset-4">
              {contact.email}
            </a>
          </dd>
        </div>
      ) : null}
    </dl>
  );
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await fetchEventDetail(params.id);
  const fallbackDescription = "Club activations for Rayon Nation.";
  if (!event) {
    return buildRouteMetadata("/events", {
      title: "Club event",
      description: fallbackDescription,
      canonical: `/events/${params.id}`,
    });
  }
  return buildRouteMetadata(`/events/${params.id}`, {
    title: `${event.title} · Club event`,
    description: event.description ?? fallbackDescription,
    canonical: `/events/${params.id}`,
  });
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await fetchEventDetail(params.id);

  if (!event) {
    notFound();
  }

  const startLabel = formatDateTime(event.startsAt);
  const endLabel = formatDateTime(event.endsAt, { timeStyle: "short" });

  return (
    <PageShell>
      <SubpageHeader
        title={event.title}
        eyebrow="Club Event"
        description={event.description ?? "Rayon Sports supporters gathering."}
        backHref="/events"
      />

      {event.heroImage ? (
        <figure className="overflow-hidden rounded-3xl border border-white/10">
          <img
            src={event.heroImage}
            alt={`Promo for ${event.title}`}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
        </figure>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="card space-y-4" aria-labelledby="event-about-heading">
          <div>
            <h2 id="event-about-heading" className="section-title text-white">
              Event overview
            </h2>
            <p className="muted text-sm leading-relaxed text-white/80">{event.description}</p>
          </div>

          {event.joinInstructions ? (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <h3 className="text-xs uppercase tracking-[0.24em] text-white/60">How to join</h3>
              <p className="mt-1 whitespace-pre-line">{event.joinInstructions}</p>
            </div>
          ) : null}

          {event.agenda.length ? (
            <div className="space-y-3">
              <h3 className="section-title text-white">Agenda</h3>
              <ol className="space-y-2 text-sm text-white/80">
                {event.agenda.map((item, index) => (
                  <li key={`${event.id}-agenda-${index}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {event.tags.length ? (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-white/60">
              {event.tags.map((tag) => (
                <span key={`${event.id}-${tag}`} className="rounded-full bg-white/10 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="card space-y-3" aria-labelledby="rsvp-heading">
            <h2 id="rsvp-heading" className="section-title text-white">
              Reserve your spot
            </h2>
            <RsvpButton eventId={event.id} eventTitle={event.title} />
            <p className="muted text-xs text-white/70">
              We are using a placeholder session user. Final confirmations will appear once you log in as a verified fan.
            </p>
          </div>

          <div className="card space-y-4" aria-labelledby="event-details-heading">
            <div>
              <h2 id="event-details-heading" className="section-title text-white">
                Event details
              </h2>
              <dl className="space-y-3 text-sm text-white/80">
                <div>
                  <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Kick-off</dt>
                  <dd>{startLabel ?? "Schedule pending"}</dd>
                </div>
                {endLabel ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Wrap-up</dt>
                    <dd>{endLabel}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Location</dt>
                  <dd>{event.location ?? "Venue TBC"}</dd>
                  {event.address ? <dd className="text-xs text-white/60">{event.address}</dd> : null}
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Capacity</dt>
                  <dd>{formatCapacity(event.capacity, event.rsvpCount)}</dd>
                </div>
                {event.price ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Pricing</dt>
                    <dd>{event.price}</dd>
                  </div>
                ) : null}
                {event.host.name ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Host</dt>
                    <dd>
                      {event.host.name}
                      {event.host.role ? <span className="text-xs text-white/60"> · {event.host.role}</span> : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <div className="card space-y-3" aria-labelledby="event-contact-heading">
            <h2 id="event-contact-heading" className="section-title text-white">
              Contact team
            </h2>
            <ContactBlock contact={event.contact} />
          </div>

          <div className="card space-y-3" aria-labelledby="event-actions-heading">
            <h2 id="event-actions-heading" className="section-title text-white">
              Quick actions
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <Link
                href="/tickets"
                className="btn min-h-[44px] justify-center bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                Secure tickets
              </Link>
              <Link
                href="/wallet"
                className="btn-secondary min-h-[44px] justify-center"
              >
                View wallet
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
