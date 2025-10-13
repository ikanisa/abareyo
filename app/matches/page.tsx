import { buildRouteMetadata } from "@/app/_lib/navigation";

import MatchesClient from "./MatchesClient";
import {
  highlightClips as fallbackHighlights,
  leagueTable as fallbackStandings,
  matches as fallbackMatches,
} from "@/app/_data/matches";

export const metadata = buildRouteMetadata("/matches");

type MatchCentreResponse = {
  matches?: typeof fallbackMatches;
  highlights?: typeof fallbackHighlights;
  standings?: typeof fallbackStandings;
};

const resolveBaseUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    const protocol = vercel.startsWith("http") ? "" : "https://";
    return `${protocol}${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
};

const fetchMatchCentre = async () => {
  try {
    const response = await fetch(`${resolveBaseUrl()}/api/matches`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Failed to load matches (${response.status})`);
    }
    const payload = (await response.json()) as MatchCentreResponse;
    return {
      matches: payload.matches?.length ? payload.matches : fallbackMatches,
      highlights: payload.highlights?.length ? payload.highlights : fallbackHighlights,
      standings: payload.standings?.length ? payload.standings : fallbackStandings,
    };
  } catch (error) {
    console.warn("Falling back to fixture matches", error);
    return {
      matches: fallbackMatches,
      highlights: fallbackHighlights,
      standings: fallbackStandings,
    };
  }
};

const MatchesPage = async () => {
  const { matches, highlights, standings } = await fetchMatchCentre();
  return <MatchesClient matches={matches} highlights={highlights} standings={standings} />;
};

export default MatchesPage;
