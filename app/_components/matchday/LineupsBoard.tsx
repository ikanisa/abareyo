import type { Lineup } from "@/app/_data/matchday";

type LineupsBoardProps = {
  home: Lineup;
  away: Lineup;
};

const renderPlayers = (players: Lineup["starters"]) => (
  <ol className="grid grid-cols-3 gap-3 text-center text-xs text-white/80">
    {players.map((player) => (
      <li
        key={`${player.num}-${player.name}`}
        className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/5 p-3"
      >
        <span className="text-lg font-black text-white">{player.num}</span>
        <span className="font-semibold">{player.name}</span>
        <span className="text-[0.65rem] uppercase tracking-wide text-white/60">
          {player.pos}
        </span>
      </li>
    ))}
  </ol>
);

const LineupsBoard = ({ home, away }: LineupsBoardProps) => {
  return (
    <section className="space-y-6 text-white">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-800/60 p-4 shadow-lg">
        <header className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
          <span>Rayon • {home.formation}</span>
          <span>APR • {away.formation}</span>
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Rayon starters</h3>
            {renderPlayers(home.starters)}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">APR starters</h3>
            {renderPlayers(away.starters)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl bg-slate-900/60 p-4 text-sm text-white/80 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">Rayon bench</h3>
          <ul className="space-y-2">
            {home.bench.map((player) => (
              <li key={`${player.num}-${player.name}`} className="flex items-center justify-between">
                <span>{player.name}</span>
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {player.pos} • {player.num}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">APR bench</h3>
          <ul className="space-y-2">
            {away.bench.map((player) => (
              <li key={`${player.num}-${player.name}`} className="flex items-center justify-between">
                <span>{player.name}</span>
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {player.pos} • {player.num}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default LineupsBoard;
