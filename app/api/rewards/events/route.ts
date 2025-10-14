import { NextResponse } from "next/server";
import { history, rewardSummary } from "@/app/_data/rewards";

const freeTicketPerks = [
  {
    id: "perk-free-blue",
    match_id: "rayon-apr",
    zone: "BLUE",
    expiresOn: "2024-06-21",
  },
];

export async function GET() {
  return NextResponse.json({
    user: {
      points: rewardSummary.points,
      tier: rewardSummary.tier.toLowerCase(),
    },
    freeTickets: freeTicketPerks,
    events: history,
    rules: {
      earn: "Earn points via match attendance, SACCO deposits, and partner services.",
      redeem: "Redeem via USSD or in-app for tickets and merch.",
    },
  });
}
