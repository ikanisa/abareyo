import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return successResponse([]);
  }
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return errorResponse('userId is required');
  }

  const { data, error } = await supabase
    .from('tickets')
    .select(
      `id, match_id, zone, gate, state, updated_at, qr_token,
       matches(title, home_team, away_team, venue, date)
      `,
    )
    .eq('user_id', userId)
    .eq('paid', true)
    .order('updated_at', { ascending: false });
  if (error) {
    return errorResponse(error.message, 500);
  }

  const formatted = (data ?? []).map((ticket) => {
    const match = Array.isArray(ticket.matches)
      ? ticket.matches[0]
      : ticket.matches;

    return {
      passId: ticket.id,
      matchId: ticket.match_id,
      matchOpponent: match
        ? `${match.home_team ?? 'Rayon'} vs ${match.away_team ?? ''}`.trim()
        : null,
      kickoff: match?.date ?? null,
      venue: match?.venue ?? null,
      zone: ticket.zone,
      gate: ticket.gate,
      updatedAt: ticket.updated_at,
      qrToken: ticket.qr_token,
      state: ticket.state,
    };
  });

  return successResponse(formatted);
}
