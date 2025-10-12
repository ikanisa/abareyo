import Link from "next/link";

import { quickActionTiles } from "@/app/_config/home";

import EmptyState from "./EmptyState";

const QuickTiles = () => {
  if (quickActionTiles.length === 0) {
    return (
      <EmptyState
        title="No quick actions yet"
        description="We will surface ticketing, wallet and membership shortcuts here as they become available."
        icon="⏳"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4" role="list">
      {quickActionTiles.map((tile) => (
        <Link
          key={tile.id}
          href={tile.href}
          className="tile flex flex-col items-center gap-2 py-5 text-center"
          aria-label={tile.ariaLabel}
          role="listitem"
        >
          <span aria-hidden="true" className="text-2xl">
            {tile.emoji}
          </span>
          <span className="font-semibold tracking-wide">{tile.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickTiles;
