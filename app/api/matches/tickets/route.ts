import { NextRequest } from 'next/server';
import { getSupabase } from '../../_lib/supabase';
import { errorResponse, successResponse } from '../../_lib/responses';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return successResponse([]);
  }
  const status = req.nextUrl.searchParams.get('status');

  let query = supabase.from('matches').select('*').order('date', { ascending: true });
  if (status && ['upcoming', 'live', 'ft'].includes(status)) {
    query = query.eq('status', status as 'upcoming' | 'live' | 'ft');
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse(error.message, 500);
  }

  const matchIds = (data ?? []).map((match) => match.id).filter(Boolean) as string[];
  let ticketCounts: Record<string, Record<string, number>> = {};
  if (matchIds.length > 0) {
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('match_id, zone, paid')
      .in('match_id', matchIds);
    if (ticketsError) {
      return errorResponse(ticketsError.message, 500);
    }
    ticketCounts = (tickets ?? []).reduce((acc, ticket) => {
      if (!ticket.match_id) {
        return acc;
      }
      const matchMap = acc[ticket.match_id] ?? {};
      const zoneKey = ticket.zone ?? 'Regular';
      const current = matchMap[zoneKey] ?? 0;
      return {
        ...acc,
        [ticket.match_id]: {
          ...matchMap,
          [zoneKey]: current + 1,
        },
      };
    }, {} as Record<string, Record<string, number>>);
  }

  const enriched = (data ?? []).map((match) => {
    const zoneTotals = {
      VIP: {
        total: match.seats_vip ?? 0,
        price: match.vip_price ?? 0,
        label: 'VIP',
      },
      Regular: {
        total: match.seats_regular ?? 0,
        price: match.regular_price ?? 0,
        label: 'Regular',
      },
      Blue: {
        total: match.seats_blue ?? 0,
        price: match.blue_price ?? match.regular_price ?? 0,
        label: 'Fan Zone',
      },
    } as const;

    const sold = ticketCounts[match.id] ?? {};
    const zones = (Object.entries(zoneTotals) as [keyof typeof zoneTotals, (typeof zoneTotals)[keyof typeof zoneTotals]][]).map(
      ([zoneKey, details]) => {
        const soldCount = sold[zoneKey] ?? 0;
        const seatsLeft = Math.max(details.total - soldCount, 0);
        return {
          id: `${match.id}-${zoneKey.toLowerCase()}`,
          zone: zoneKey,
          name: details.label,
          price: details.price,
          totalSeats: details.total,
          seatsLeft,
        };
      },
    );

    return {
      ...match,
      zones,
    };
  });

  return successResponse(enriched);
}
