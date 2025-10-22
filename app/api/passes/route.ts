import { NextResponse } from "next/server";
import { matches as fixtureMatches } from "@/app/_data/matches";

export const runtime = "nodejs";

type Pass = {
  id: string;
  order_id?: string | null;
  zone: string;
  gate?: string | null;
  state: "active" | "used" | "transferred";
  qr_token_hash?: string | null;
  match?: {
    id: string;
    opponent: string;
    kickoff: string | null;
  };
};

export async function GET() {
  const sample: Pass[] = fixtureMatches.slice(0, 3).map((match, index) => {
    const home = typeof match.home === "string" ? match.home : "";
    const away = typeof match.away === "string" ? match.away : "";
    const opponent = home.toLowerCase().includes("rayon")
      ? away || "Opponent"
      : home || away || "Opponent";

    return {
      id: `pass-${String(match.id ?? index)}`,
      order_id: index === 0 ? `order-${index + 101}` : null,
      zone: index === 1 ? "BLUE" : "VIP",
      gate: ["A", "C", "B"][index % 3],
      state: index === 2 ? "used" : "active",
      qr_token_hash: null,
      match: {
        id: String(match.id ?? `fixture-${index}`),
        opponent,
        kickoff:
          typeof match.kickoff === "string"
            ? match.kickoff
            : typeof match.date === "string"
            ? match.date
            : null,
      },
    };
  });

  return NextResponse.json({ passes: sample });
}
