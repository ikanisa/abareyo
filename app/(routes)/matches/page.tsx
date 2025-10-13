import { buildRouteMetadata } from "@/app/_lib/navigation";

import MatchesClient from "./MatchesClient";
import {
  highlightClips,
  leagueTable,
  matches,
  matchFeedUpdatedAt,
} from "@/app/_data/matches";

export const metadata = buildRouteMetadata("/matches");

const MatchesPage = () => (
  <MatchesClient
    matches={matches}
    highlights={highlightClips}
    standings={leagueTable}
    updatedAt={matchFeedUpdatedAt}
  />
);

export default MatchesPage;
