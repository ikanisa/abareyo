import Link from "next/link";
import { cache } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";

import { buildBackendUrl } from "../_lib/backend-url";

export const dynamic = "force-dynamic";
export const metadata = buildRouteMetadata("/clubs", {
  title: "Fan clubs",
  description: "Discover verified Rayon Sports supporter clubs and connect with captains near you.",
});

type FanClubSummary = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  memberCount: number | null;
  tagline: string | null;
  heroImage: string | null;
};

type ClubsListing = {
  clubs: FanClubSummary[];
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

const mapClubSummary = (payload: unknown): FanClubSummary | null => {
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

  const tagline =
    toStringValue(record.tagline) ||
    toStringValue(record.summary) ||
    toStringValue(record.description) ||
    toStringValue(record.bio);

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
    tagline,
    heroImage,
  };
};

const parseClubsResponse = (payload: unknown): ClubsListing => {
  if (!payload || typeof payload !== "object") {
    return { clubs: [], total: null };
  }

  const root = payload as Record<string, unknown>;
  const data =
    (typeof root.data === "object" && root.data !== null ? (root.data as Record<string, unknown>) : null) ?? root;

  const collectionSource = Array.isArray(data)
    ? data
    : Array.isArray(data.clubs)
      ? data.clubs
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.results)
          ? data.results
          : [];

  const clubs = collectionSource
    .map((item) => mapClubSummary(item))
    .filter((item): item is FanClubSummary => Boolean(item));

  const total =
    toNumberValue((data as Record<string, unknown>).total) ??
    toNumberValue((data as Record<string, unknown>).count) ??
    toNumberValue(root.total) ??
    (clubs.length ? clubs.length : null);

  return { clubs, total };
};

const fetchClubsDirectory = cache(async (): Promise<ClubsListing> => {
  try {
    const response = await fetch(buildBackendUrl("/clubs"), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clubs (${response.status})`);
    }

    const payload = await response.json();
    return parseClubsResponse(payload);
  } catch (error) {
    console.error("Unable to load clubs directory", error);
    return { clubs: [], total: null };
  }
});

const formatMemberCount = (value: number | null) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value.toLocaleString()} members`;
  }
  return "Membership updates coming soon";
};

const formatLocation = (city: string | null, region: string | null) => {
  if (city && region) {
    return `${city}, ${region}`;
  }
  if (city) {
    return city;
  }
  if (region) {
    return region;
  }
  return "Location shared by club captains";
};

const EmptyState = () => (
  <section className="card space-y-3 text-center" role="status">
    <h2 className="text-xl font-semibold text-white">Fan clubs are warming up</h2>
    <p className="muted text-sm">
      We are syncing the latest captains and meeting points. Check back shortly or follow Rayon Sports on WhatsApp for
      alerts.
    </p>
    <Link href="/community" className="btn-primary mx-auto mt-2 min-h-[44px] px-6">
      Explore the community
    </Link>
  </section>
);

const ClubsGrid = ({ clubs }: { clubs: FanClubSummary[] }) => (
  <section
    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    aria-label="Fan club directory"
    role="list"
  >
    {clubs.map((club) => (
      <article
        key={club.id}
        className="tile glass relative flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/15 bg-white/10 p-5 text-left"
        role="listitem"
        aria-labelledby={`club-${club.id}-title`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 id={`club-${club.id}-title`} className="text-xl font-semibold text-white">
              {club.name}
            </h2>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80">
              {formatMemberCount(club.memberCount)}
            </span>
          </div>
          <p className="text-sm text-white/75">{club.tagline ?? "Club captains are preparing a welcome note."}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/80">
          <span className="rounded-full bg-white/10 px-3 py-1">{formatLocation(club.city, club.region)}</span>
          <Link
            href={`/clubs/${club.id}`}
            className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label={`View details for ${club.name}`}
          >
            View details
          </Link>
        </div>
      </article>
    ))}
  </section>
);

export default async function ClubsPage() {
  const { clubs, total } = await fetchClubsDirectory();
  const totalLabel = typeof total === "number" && Number.isFinite(total) ? `${total.toLocaleString()} clubs` : null;

  return (
    <PageShell>
      <SubpageHeader
        title="Fan Clubs"
        eyebrow="Community"
        description="Join verified Rayon Sports supporter clubs, coordinate travel, and unlock matchday perks with fellow fans."
        backHref="/more"
        actions={
          totalLabel ? (
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              {totalLabel}
            </span>
          ) : undefined
        }
      />

      {clubs.length ? <ClubsGrid clubs={clubs} /> : <EmptyState />}
    </PageShell>
  );
}
