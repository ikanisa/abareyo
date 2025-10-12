import Link from "next/link";

import { gamificationTiles } from "@/app/_config/home";

import EmptyState from "./EmptyState";

const GamificationStrip = () => {
  if (gamificationTiles.length === 0) {
    return (
      <EmptyState
        title="Challenges launching soon"
        description="Mini games and fan challenges will reappear here when new competitions go live."
        icon="🎮"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list">
      {gamificationTiles.map((tile) => (
        <Link
          key={tile.id}
          className="tile flex items-center gap-3 text-left"
          href={tile.href}
          aria-label={tile.ariaLabel}
          role="listitem"
        >
          <span className="text-2xl" aria-hidden="true">
            {tile.emoji}
          </span>
          <span className="font-semibold">{tile.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default GamificationStrip;
