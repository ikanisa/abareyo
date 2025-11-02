import Link from "next/link";

type TicketMatch = {
  id?: string;
  opponent?: string | null;
  home?: string | null;
  away?: string | null;
  kickoff?: string | null;
  date?: string | null;
  venue?: string | null;
  status?: string | null;
  comp?: string | null;
  round?: string | null;
};

type TicketsGridProps = {
  matches: TicketMatch[];
};

const rayonMatchers = [/rayon/i, /gikundiro/i];

function resolveOpponent(match: TicketMatch) {
  if (match.opponent) return match.opponent;
  const home = match.home ?? "";
  const away = match.away ?? "";
  const isRayonHome = rayonMatchers.some((pattern) => pattern.test(home));
  const isRayonAway = rayonMatchers.some((pattern) => pattern.test(away));
  if (isRayonHome && away) return away;
  if (isRayonAway && home) return home;
  if (home && away) return `${home} vs ${away}`;
  return home || away || "Fixture";
}

function formatKickoff(match: TicketMatch) {
  const iso = match.kickoff ?? match.date;
  if (!iso) return "Time TBC";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time TBC";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (_error) {
    return date.toLocaleString();
  }
}

function formatCompetition(match: TicketMatch) {
  if (match.round && match.comp) return `${match.comp} · ${match.round}`;
  if (match.round) return match.round;
  return match.comp ?? "";
}

export default function TicketsGrid({ matches }: TicketsGridProps) {
  const upcoming = (matches ?? []).filter(
    (match) => (match.status ?? "upcoming") === "upcoming",
  );

  if (!upcoming.length) {
    return (
      <section className="card text-center">
        <div className="text-white/90 font-semibold">No upcoming matches</div>
        <p className="muted text-sm mt-1">
          Check back soon for the next ticket release.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      {upcoming.map((match) => {
        const id = match.id ?? formatKickoff(match);
        const href = match.id ? `/tickets/${match.id}` : "/tickets";
        return (
          <Link key={id} href={href} className="card block space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/90 font-semibold">
                  {resolveOpponent(match)}
                </div>
                <div className="muted text-xs">{formatCompetition(match)}</div>
              </div>
              <span className="tile whitespace-nowrap">USSD</span>
            </div>
            <div className="muted text-sm">
              {formatKickoff(match)} · {match.venue ?? "Venue TBC"}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
