import { NextResponse } from "next/server";

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
    kickoff: string;
  };
};

const samplePasses: Pass[] = [
  {
    id: "pass-001",
    order_id: "order-7781",
    zone: "BLUE",
    gate: "B2",
    state: "active",
    qr_token_hash: "hash-7781",
    match: {
      id: "rayon-apr",
      opponent: "APR FC",
      kickoff: "2024-06-21T18:00:00+02:00",
    },
  },
  {
    id: "pass-002",
    zone: "VIP",
    gate: "A1",
    state: "used",
    match: {
      id: "rayon-police",
      opponent: "Police FC",
      kickoff: "2024-06-14T19:30:00+02:00",
    },
  },
];

export async function GET() {
  return NextResponse.json({ passes: samplePasses });
}
