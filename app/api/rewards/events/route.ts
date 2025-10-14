import { NextResponse } from 'next/server';
import { matches as fixtureMatches } from '@/app/_data/matches';

export const runtime = 'edge';

export async function GET(){
  const nextFixture = fixtureMatches.find(match => match.status === 'upcoming') ?? fixtureMatches[0];
  const freeTickets = nextFixture ? [
    {
      id: `perk-${nextFixture.id}`,
      match_id: nextFixture.id,
      zone: 'BLUE',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
  ] : [];

  return NextResponse.json({
    user: {
      id: 'demo-user',
      points: 180,
      tier: 'silver',
    },
    freeTickets,
    events: [
      {
        id: 'evt-1',
        type: 'points-earned',
        amount: 40,
        description: 'Matchday merchandise purchase',
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
      {
        id: 'evt-2',
        type: 'perk-redeemed',
        amount: -80,
        description: 'Redeemed store discount',
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
    ],
    rules: [
      'Earn 10 points per 1,000 RWF spent via USSD top-ups.',
      'Refer friends to unlock extra perks each month.',
    ],
  });
}
