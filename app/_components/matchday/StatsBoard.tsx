import type { Stat } from "@/app/_data/matchday";

const statLabels: Record<Stat["k"], string> = {
  possession: "Possession",
  shots: "Total shots",
  shots_on: "Shots on target",
  xg: "Expected goals",
};

type StatsBoardProps = {
  stats: Stat[];
};

const formatValue = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const StatsBoard = ({ stats }: StatsBoardProps) => {
  return (
    <section aria-label="Match statistics overview" className="space-y-4">
      {stats.map((stat) => {
        const total = stat.home + stat.away;
        const homeRatio = total === 0 ? 0 : (stat.home / total) * 100;
        const awayRatio = total === 0 ? 0 : (stat.away / total) * 100;

        return (
          <article
            key={stat.k}
            className="rounded-2xl bg-white/5 p-4 text-white/80"
            aria-label={`${statLabels[stat.k]} ${formatValue(stat.home)} to ${formatValue(stat.away)}`}
          >
            <header className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
              <span>Rayon</span>
              <span>{statLabels[stat.k]}</span>
              <span>APR</span>
            </header>
            <div className="mt-2 flex items-center gap-3">
              <span className="w-10 text-right text-sm font-semibold text-white">
                {formatValue(stat.home)}
              </span>
              <div className="relative h-2 flex-1 rounded-full bg-white/10">
                <span
                  className="absolute left-0 h-full rounded-full bg-cyan-400"
                  style={{ width: `${homeRatio}%` }}
                >
                  <span className="sr-only">Rayon {formatValue(stat.home)}</span>
                </span>
                <span
                  className="absolute right-0 h-full rounded-full bg-indigo-500"
                  style={{ width: `${awayRatio}%` }}
                >
                  <span className="sr-only">APR {formatValue(stat.away)}</span>
                </span>
              </div>
              <span className="w-10 text-sm font-semibold text-white">
                {formatValue(stat.away)}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default StatsBoard;
