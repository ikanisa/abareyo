import type { H2H } from "@/app/_data/matchday";

type H2HBoardProps = {
  data: H2H;
};

const renderFormBadge = (entry: string, index: number) => {
  const copy: Record<string, string> = {
    W: "Win",
    D: "Draw",
    L: "Loss",
  };
  const background: Record<string, string> = {
    W: "bg-emerald-500/80",
    D: "bg-amber-500/80",
    L: "bg-rose-500/80",
  };

  return (
    <span
      key={`${entry}-${index}`}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${background[entry]}`}
      aria-label={copy[entry] ?? entry}
    >
      {entry}
    </span>
  );
};

const H2HBoard = ({ data }: H2HBoardProps) => {
  return (
    <section className="space-y-6 text-white">
      <div className="rounded-3xl bg-white/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
          Last five meetings
        </h3>
        <ul className="mt-3 space-y-3 text-sm text-white/80">
          {data.last5.map((fixture) => (
            <li
              key={`${fixture.date}-${fixture.score}`}
              className="flex items-center justify-between rounded-2xl bg-slate-900/50 p-3"
            >
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {fixture.date}
                </span>
                <span>
                  {fixture.home} vs {fixture.away}
                </span>
              </div>
              <span className="text-lg font-black text-white">{fixture.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 rounded-3xl bg-slate-900/70 p-4 text-sm text-white/80 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Rayon form
          </h3>
          <div className="mt-3 flex gap-2" aria-label="Rayon recent form">
            {data.form.home.map((entry, index) => renderFormBadge(entry, index))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            APR form
          </h3>
          <div className="mt-3 flex gap-2" aria-label="APR recent form">
            {data.form.away.map((entry, index) => renderFormBadge(entry, index))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default H2HBoard;
