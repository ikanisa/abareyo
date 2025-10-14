import PageShell from "@/app/_components/shell/PageShell";
import { buildRouteMetadata } from "@/app/_lib/navigation";
import {
  matches as fallbackMatches,
  type Match,
} from "@/app/_data/matches";

import MatchesClient from "./MatchesClient";

export const metadata = buildRouteMetadata("/matches");

type MatchCentreResponse = {
  matches?: Match[];
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

const fetchMatches = async (): Promise<Match[]> => {
  try {
    const response = await fetch(`${resolveBaseUrl()}/api/matches`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Failed to load matches (${response.status})`);
    }
    const payload = (await response.json()) as MatchCentreResponse;
    if (payload.matches && payload.matches.length > 0) {
      return payload.matches;
    }
  } catch (error) {
    console.warn("Falling back to fixture matches", error);
  }
  return fallbackMatches;
};

const MatchesPage = async () => {
  const matches = await fetchMatches();
  return (
    <PageShell>
      <MatchesClient matches={matches} />
    </PageShell>
  );
};

export default MatchesPage;
