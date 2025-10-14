import { NextResponse } from 'next/server';
import { matches as fixtureMatches } from '@/app/_data/matches';

export const runtime = 'edge';

export async function GET(){
  const sample = fixtureMatches.slice(0,3).map((match, index)=>{
    const home = typeof match.home === 'string' ? match.home : '';
    const away = typeof match.away === 'string' ? match.away : '';
    const opponent = home.toLowerCase().includes('rayon') ? away : home || away || 'Opponent';
    return {
      id: `pass-${match.id ?? index}`,
      order_id: index === 0 ? `order-${index + 101}` : null,
      zone: index === 1 ? 'BLUE' : 'VIP',
      gate: ['A','C','B'][index % 3],
      state: index === 2 ? 'used' : 'active',
      match: {
        id: match.id,
        opponent,
        kickoff: match.kickoff,
      },
    };
  });
  return NextResponse.json({ passes: sample });
}
