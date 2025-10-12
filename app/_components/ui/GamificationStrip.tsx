"use client";

import Link from "next/link";

import { gamificationTiles } from "@/app/_config/home";

export default function GamificationStrip() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {gamificationTiles.map((tile) => (
          <Link
            key={tile.id}
            className="tile text-left"
            href={tile.href}
            aria-label={tile.ariaLabel}
          >
            <span className="mr-2" aria-hidden="true">
              {tile.emoji}
            </span>
            {tile.label}
          </Link>
      ))}
    </div>
  );
}
