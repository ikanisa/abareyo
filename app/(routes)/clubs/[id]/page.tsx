import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { buildBackendUrl } from "../../_lib/backend-url";

import JoinClubButton from "./JoinClubButton";

type ClubContact = {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};

type ClubStat = {
  label: string;
  value: string;
};

type ClubEventSummary = {
  id: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  description: string | null;
};

type FanClubDetail = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  memberCount: number | null;
  tagline: string | null;
  heroImage: string | null;
  about: string | null;
  meetingSchedule: string | null;
  meetingLocation: string | null;
  contact: ClubContact;
  stats: ClubStat[];
  upcomingEvents: ClubEventSummary[];
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
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const mapEventSummary = (payload: unknown): ClubEventSummary | null => {
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
  };
};

const parseClubContact = (payload: unknown): ClubContact => {
  if (!payload || typeof payload !== "object") {
    return { name: null, phone: null, whatsapp: null, email: null };
  }
  const record = payload as Record<string, unknown>;
  return {
    name:
      toStringValue(record.name) ||
      toStringValue(record.contactName) ||
      toStringValue(record.lead) ||
      toStringValue(record.captain),
    phone:
      toStringValue(record.phone) ||
      toStringValue(record.phoneNumber) ||
      toStringValue(record.contactPhone),
    whatsapp:
      toStringValue(record.whatsapp) ||
      toStringValue(record.whatsappNumber) ||
      toStringValue(record.phone),
    email:
      toStringValue(record.email) ||
      toStringValue(record.contactEmail),
  };
};

const mapClubDetail = (payload: unknown): FanClubDetail | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const id =
    toStringValue(record.id) ||
    toStringValue(record.slug) ||
    toStringValue(record.clubId) ||
    toStringValue(record.identifier);
  const name = toStringValue(record.name) || toStringValue(record.title);

  if (!id || !name) {
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
          name:
            toStringValue(record.contactName) ||
            toStringValue(record.captain) ||
            toStringValue(record.lead),
          phone: toStringValue(record.contactPhone),
          whatsapp: toStringValue(record.contactWhatsapp),
          email: toStringValue(record.contactEmail),
        };

  const rawStats = Array.isArray(record.stats) ? record.stats : record.metrics;
  const stats: ClubStat[] = Array.isArray(rawStats)
    ? rawStats
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }
          const stat = entry as Record<string, unknown>;
          const label =
            toStringValue(stat.label) ||
            toStringValue(stat.name) ||
            toStringValue(stat.metric) ||
            toStringValue(stat.title);
          const value = toStringValue(stat.value) || toStringValue(stat.display) || toStringValue(stat.total);
          if (!label || !value) {
            return null;
          }
          return { label, value } satisfies ClubStat;
        })
        .filter((entry): entry is ClubStat => Boolean(entry))
    : [];

  const upcomingEvents = Array.isArray(record.upcomingEvents)
    ? record.upcomingEvents
        .map((event) => mapEventSummary(event))
        .filter((event): event is ClubEventSummary => Boolean(event))
    : [];

  return {
    id,
    name,
    city: toStringValue(record.city) || toStringValue(record.town) || toStringValue(record.location),
    region: toStringValue(record.region) || toStringValue(record.zone),
    memberCount:
      toNumberValue(record.members) ??
      toNumberValue(record.memberCount) ??
      toNumberValue(record.totalMembers) ??
      null,
    tagline:
      toStringValue(record.tagline) ||
      toStringValue(record.summary) ||
      toStringValue(record.description) ||
      toStringValue(record.bio),
    heroImage,
    about:
      toStringValue(record.about) ||
      toStringValue(record.description) ||
      toStringValue(record.bio) ||
      "Captains will add more details soon.",
    meetingSchedule:
      toStringValue(record.meetingSchedule) ||
      toStringValue(record.schedule) ||
      toStringArray(record.meetingTimes).join(" • ") ||
      null,
    meetingLocation:
      toStringValue(record.meetingLocation) ||
      toStringValue(record.meetupPoint) ||
      toStringValue(record.primaryVenue),
    contact: parseClubContact(contactPayload),
    stats,
    upcomingEvents,
  };
};

const fetchClubDetail = cache(async (id: string): Promise<FanClubDetail | null> => {
  try {
    const response = await fetch(buildBackendUrl(`/clubs/${encodeURIComponent(id)}`), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch club (${response.status})`);
    }

    const payload = await response.json();
    if (payload && typeof payload === "object") {
      const root = payload as Record<string, unknown>;
      const data =
        (typeof root.data === "object" && root.data !== null ? (root.data as Record<string, unknown>) : null) ?? root;
      return mapClubDetail(data);
    }
    return mapClubDetail(payload);
  } catch (error) {
    console.error(`Unable to load club ${id}`, error);
    return null;
  }
});

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Date shared soon";
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const formatMemberCount = (value: number | null) => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value ? `${value.toLocaleString()} supporters` : "New club";
  }
  return "Updating";
};

const ContactBlock = ({ contact }: { contact: ClubContact }) => {
  if (!contact.name && !contact.phone && !contact.whatsapp && !contact.email) {
    return (
      <p className="muted text-sm">
        Captains will publish contact details soon. Tap “Join” and we will notify them of your interest.
      </p>
    );
  }

  return (
    <dl className="space-y-2 text-sm text-white/80">
      {contact.name ? (
        <div>
          <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Lead captain</dt>
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
  const club = await fetchClubDetail(params.id);
  const fallbackDescription = "Discover Rayon Sports supporter captains near you.";
  if (!club) {
    return buildRouteMetadata("/clubs", {
      title: "Fan club",
      description: fallbackDescription,
      canonical: `/clubs/${params.id}`,
    });
  }
  return buildRouteMetadata(`/clubs/${params.id}`, {
    title: `${club.name} · Fan club`,
    description: club.tagline ?? club.about ?? fallbackDescription,
    canonical: `/clubs/${params.id}`,
  });
}

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const club = await fetchClubDetail(params.id);

  if (!club) {
    notFound();
  }

  const { upcomingEvents } = club;

  return (
    <PageShell>
      <SubpageHeader
        title={club.name}
        eyebrow="Fan Club"
        description={club.tagline ?? "Coordinating meet-ups for Rayon Nation."}
        backHref="/clubs"
      />

      {club.heroImage ? (
        <figure className="overflow-hidden rounded-3xl border border-white/10">
          <img
            src={club.heroImage}
            alt={`Members of ${club.name}`}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
        </figure>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="card space-y-4" aria-labelledby="club-about-heading">
          <div>
            <h2 id="club-about-heading" className="section-title text-white">
              About this club
            </h2>
            <p className="muted text-sm leading-relaxed text-white/80">{club.about}</p>
          </div>

          {club.meetingSchedule ? (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <h3 className="text-xs uppercase tracking-[0.24em] text-white/60">Meeting cadence</h3>
              <p className="mt-1 whitespace-pre-line">{club.meetingSchedule}</p>
            </div>
          ) : null}

          {club.meetingLocation ? (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <h3 className="text-xs uppercase tracking-[0.24em] text-white/60">Primary meetup point</h3>
              <p className="mt-1">{club.meetingLocation}</p>
            </div>
          ) : null}

          {upcomingEvents.length ? (
            <div className="space-y-3">
              <h3 className="section-title text-white">Upcoming gatherings</h3>
              <ul className="space-y-3" aria-label="Club events">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
                      <span className="font-semibold text-white">{event.title}</span>
                      <span>{formatDateTime(event.startsAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/75">{event.description ?? "Club captains will share details soon."}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/60">
                      <span>{event.location ?? "Location TBC"}</span>
                      <Link
                        href={`/events/${event.id}`}
                        className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      >
                        Event details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="card space-y-3" aria-labelledby="join-club-heading">
            <h2 id="join-club-heading" className="section-title text-white">
              Join this club
            </h2>
            <JoinClubButton clubId={club.id} clubName={club.name} />
            <p className="muted text-xs text-white/70">
              We’ll share your request with the captains using a demo session user so you can preview the onboarding flow.
            </p>
          </div>

          <div className="card space-y-4" aria-labelledby="club-insights-heading">
            <div>
              <h2 id="club-insights-heading" className="section-title text-white">
                Club insights
              </h2>
              <dl className="grid grid-cols-1 gap-4 text-sm text-white/80">
                <div>
                  <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Members visible</dt>
                  <dd>{formatMemberCount(club.memberCount)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.24em] text-white/60">Region</dt>
                  <dd>
                    {club.city && club.region
                      ? `${club.city}, ${club.region}`
                      : club.city || club.region || "Captains will confirm"}
                  </dd>
                </div>
              </dl>
            </div>
            {club.stats.length ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">Highlights</h3>
                <ul className="space-y-2 text-sm text-white/80">
                  {club.stats.map((stat) => (
                    <li key={`${stat.label}-${stat.value}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-2">
                      <span className="text-white/70">{stat.label}</span>
                      <span className="font-semibold text-white">{stat.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="card space-y-3" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="section-title text-white">
              Captain contacts
            </h2>
            <ContactBlock contact={club.contact} />
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
