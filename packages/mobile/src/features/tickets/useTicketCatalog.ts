import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSupabase } from "@/api";

export type TicketZone = {
  id: string;
  label: string;
  price: number;
  remaining: number;
};

export type TicketedMatch = {
  id: string;
  opponent: string;
  kickoff: string;
  venue: string;
  competition: string;
  status: "scheduled" | "onsale" | "soldout";
  zones: TicketZone[];
};

const FALLBACK: TicketedMatch[] = [
  {
    id: "apr-derby",
    opponent: "APR FC",
    kickoff: new Date().toISOString(),
    venue: "Amahoro Stadium",
    competition: "Rwanda Premier League",
    status: "onsale",
    zones: [
      { id: "vip", label: "VIP", price: 25000, remaining: 120 },
      { id: "regular", label: "Regular", price: 8000, remaining: 1420 },
      { id: "fan", label: "Fan Zone", price: 5000, remaining: 620 },
    ],
  },
  {
    id: "gasogi",
    opponent: "Gasogi United",
    kickoff: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    venue: "Kigali Pelé Stadium",
    competition: "Peace Cup",
    status: "scheduled",
    zones: [
      { id: "vip", label: "VIP", price: 20000, remaining: 80 },
      { id: "regular", label: "Regular", price: 6000, remaining: 990 },
    ],
  },
];

export function useTicketCatalog() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["ticket-catalog"],
    queryFn: async (): Promise<TicketedMatch[]> => {
      if (!supabase) {
        return FALLBACK;
      }

      const { data, error } = await supabase
        .from("ticket_catalog")
        .select("id, opponent, kickoff, venue, competition, status, zones")
        .order("kickoff", { ascending: true });

      if (error || !data?.length) {
        if (error) {
          console.warn("[tickets] Falling back to static catalog", error.message);
        }
        return FALLBACK;
      }

      return data.map((entry) => ({
        id: entry.id,
        opponent: entry.opponent,
        kickoff: entry.kickoff,
        venue: entry.venue,
        competition: entry.competition,
        status: (entry.status ?? "scheduled") as TicketedMatch["status"],
        zones: Array.isArray(entry.zones)
          ? (entry.zones as TicketZone[])
          : FALLBACK[0].zones,
      }));
    },
    initialData: FALLBACK,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNextMatch() {
  const { data } = useTicketCatalog();

  return useMemo(() => data?.[0] ?? FALLBACK[0], [data]);
}
