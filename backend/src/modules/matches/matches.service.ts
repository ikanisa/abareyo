import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

type MatchSummary = {
  id: string;
  opponent: string;
  kickoff: string;
  venue: string;
  status: string;
  competition?: string | null;
  score: { home: number; away: number } | null;
  timeline: Array<{ minute: number; type: string; description: string; team: 'home' | 'away' }>;
  stats: Array<{ label: string; home: number; away: number }>;
};

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSummaries(): Promise<MatchSummary[]> {
    const matches = await this.prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
      include: {
        ticketOrders: {
          where: {
            status: { in: ['paid', 'pending'] },
          },
          include: { items: true },
        },
      },
    });

    return matches.map((match) => {
      const score = match.status === 'live' || match.status === 'finished'
        ? this.deriveScore(match.id)
        : null;

      const timeline = this.mockTimeline(match.status);
      const stats = this.mockStats(match.status);

      return {
        id: match.id,
        opponent: match.opponent,
        kickoff: match.kickoff.toISOString(),
        venue: match.venue,
        status: match.status,
        competition: match.competition ?? null,
        score,
        timeline,
        stats,
      } satisfies MatchSummary;
    });
  }

  private deriveScore(matchId: string) {
    const hash = Array.from(matchId)
      .map((char) => char.charCodeAt(0))
      .reduce((sum, code) => sum + code, 0);
    return {
      home: hash % 4,
      away: (hash >> 2) % 3,
    };
  }

  private mockTimeline(status: string) {
    if (status !== 'live' && status !== 'finished') {
      return [];
    }
    return [
      { minute: 8, type: 'goal', description: 'Mugisha opens the scoring with a far-post tap in', team: 'home' as const },
      { minute: 34, type: 'yellow', description: 'Kayisire booked for a late challenge', team: 'home' as const },
      { minute: 52, type: 'goal', description: 'Habimana equalises with a header', team: 'away' as const },
      { minute: 68, type: 'goal', description: 'Penalty calmly taken by Rayon Sports', team: 'home' as const },
    ];
  }

  private mockStats(status: string) {
    if (status !== 'live' && status !== 'finished') {
      return [];
    }
    return [
      { label: 'Possession', home: 58, away: 42 },
      { label: 'Shots on target', home: 7, away: 3 },
      { label: 'Corners', home: 6, away: 4 },
    ];
  }
}
