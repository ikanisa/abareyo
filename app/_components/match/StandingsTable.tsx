import type { StandingsRow } from "@/app/_data/matches";

type StandingsTableProps = {
  table: StandingsRow[];
  updatedAt?: string;
};

const formBadgeStyles: Record<"W" | "D" | "L", string> = {
  W: "bg-emerald-500/20 text-emerald-100",
  D: "bg-white/10 text-white/80",
  L: "bg-rose-500/20 text-rose-100",
};

const formatUpdatedAt = (iso?: string) => {
  if (!iso) return "Updated moments ago";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Updated moments ago";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 minute ago";
  if (minutes < 60) return `Updated ${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Updated 1 hour ago";
  if (hours < 24) return `Updated ${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "Updated 1 day ago" : `Updated ${days} days ago`;
};

const StandingsTable = ({ table, updatedAt }: StandingsTableProps) => {
  if (!table || table.length === 0) {
    return null;
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-lg font-semibold text-white">League table</h3>
        <span className="text-xs uppercase tracking-wide text-white/60">{formatUpdatedAt(updatedAt)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="text-xs uppercase tracking-wide text-white/60">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Team</th>
              <th className="py-2 pr-4 text-center">P</th>
              <th className="py-2 pr-4 text-center">W</th>
              <th className="py-2 pr-4 text-center">D</th>
              <th className="py-2 pr-4 text-center">L</th>
              <th className="py-2 pr-4 text-center">GD</th>
              <th className="py-2 pr-4 text-center">Pts</th>
              <th className="py-2">Form</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.team} className="border-b border-white/5 last:border-none">
                <td className="py-3 pr-4 text-white/70">{row.position}</td>
                <td className="py-3 pr-4 font-semibold text-white">{row.team}</td>
                <td className="py-3 pr-4 text-center">{row.played}</td>
                <td className="py-3 pr-4 text-center">{row.wins}</td>
                <td className="py-3 pr-4 text-center">{row.draws}</td>
                <td className="py-3 pr-4 text-center">{row.losses}</td>
                <td className="py-3 pr-4 text-center">{row.goalDiff}</td>
                <td className="py-3 pr-4 text-center text-lg font-semibold text-white">{row.points}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {row.form.map((result, index) => (
                      <span
                        key={`${row.team}-form-${index}`}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${formBadgeStyles[result]}`}
                        aria-label={`${row.team} ${result === "W" ? "win" : result === "D" ? "draw" : "loss"}`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;
