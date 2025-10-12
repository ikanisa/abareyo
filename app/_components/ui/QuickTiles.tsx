"use client";

import Link from "next/link";

import { quickActionTiles } from "@/app/_config/home";

export default function QuickTiles() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
      {quickActionTiles.map((tile) => (
        <Link key={tile.id} href={tile.href} className="tile flex flex-col items-center gap-1 text-center" aria-label={tile.ariaLabel}>
          <span aria-hidden="true" className="text-xl">
            {tile.emoji}
          </span>
          <span className="font-medium">{tile.label}</span>
        </Link>
      ))}
    </div>
  );
}

