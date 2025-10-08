import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AdminMatchService {
  constructor(private readonly prisma: PrismaService) {}

  async listMatches() {
    const matches = await this.prisma.match.findMany({
      orderBy: { kickoff: 'desc' },
      include: { zones: true, gates: true },
    });

    return matches;
  }

  async getMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { zones: true, gates: true } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async createMatch(payload: {
    opponent: string;
    kickoff: string;
    venue: string;
    status?: MatchStatus;
    competition?: string;
  }) {
    return this.prisma.match.create({
      data: {
        opponent: payload.opponent,
        kickoff: new Date(payload.kickoff),
        venue: payload.venue,
        status: payload.status ?? 'scheduled',
        competition: payload.competition ?? null,
      },
    });
  }

  async updateMatch(matchId: string, payload: Partial<{ opponent: string; kickoff: string; venue: string; status: MatchStatus; competition?: string }>) {
    const existing = await this.prisma.match.findUnique({ where: { id: matchId } });
    
    if (!existing) {
      throw new NotFoundException('Match not found');
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        opponent: payload.opponent ?? existing.opponent,
        venue: payload.venue ?? existing.venue,
        competition: payload.competition ?? existing.competition,
        status: payload.status ?? existing.status,
        kickoff: payload.kickoff ? new Date(payload.kickoff) : existing.kickoff,
      },
    });
  }

  async deleteMatch(matchId: string) {
    await this.prisma.match.delete({ where: { id: matchId } });
  }

  async listZones(matchId: string) {
    await this.ensureMatch(matchId);
    return this.prisma.ticketZone.findMany({ where: { matchId }, orderBy: { name: 'asc' } });
  }

  async upsertZone(matchId: string, payload: { name: string; capacity: number; price: number; gate?: string }) {
    await this.ensureMatch(matchId);

    return this.prisma.ticketZone.upsert({
      where: {
        matchId_name: {
          matchId,
          name: payload.name,
        },
      },
      update: {
        capacity: payload.capacity,
        price: payload.price,
        gate: payload.gate ?? null,
      },
      create: {
        matchId,
        name: payload.name,
        capacity: payload.capacity,
        price: payload.price,
        gate: payload.gate ?? null,
      },
    });
  }

  async deleteZone(matchId: string, zoneId: string) {
    await this.ensureMatch(matchId);
    await this.prisma.ticketZone.delete({ where: { id: zoneId } });
  }

  async listGates(matchId: string) {
    await this.ensureMatch(matchId);
    return this.prisma.matchGate.findMany({ where: { matchId }, orderBy: { name: 'asc' } });
  }

  async upsertGate(matchId: string, payload: { name: string; location?: string; maxThroughput?: number }) {
    await this.ensureMatch(matchId);

    return this.prisma.matchGate.upsert({
      where: {
        matchId_name: {
          matchId,
          name: payload.name,
        },
      },
      update: {
        location: payload.location ?? null,
        maxThroughput: payload.maxThroughput ?? null,
      },
      create: {
        matchId,
        name: payload.name,
        location: payload.location ?? null,
        maxThroughput: payload.maxThroughput ?? null,
      },
    });
  }

  async deleteGate(matchId: string, gateId: string) {
    await this.ensureMatch(matchId);
    await this.prisma.matchGate.delete({ where: { id: gateId } });
  }

  async getScanMetrics(matchId: string) {
    await this.ensureMatch(matchId);

    const scans = await this.prisma.gateScan.findMany({
      where: {
        pass: {
          order: {
            matchId,
          },
        },
      },
      include: {
        pass: {
          select: { gate: true },
        },
      },
    });

    const metrics = new Map<string, { total: number; rejected: number; verified: number }>();

    for (const scan of scans) {
      const gateName = scan.pass?.gate ?? 'Unassigned';
      const record = metrics.get(gateName) ?? { total: 0, rejected: 0, verified: 0 };
      record.total += 1;
      if (scan.result === 'verified') {
        record.verified += 1;
      } else {
        record.rejected += 1;
      }
      metrics.set(gateName, record);
    }

    return Array.from(metrics.entries()).map(([gate, meta]) => ({
      gate,
      total: meta.total,
      verified: meta.verified,
      rejected: meta.rejected,
    }));
  }

  private async ensureMatch(matchId: string) {
    const exists = await this.prisma.match.count({ where: { id: matchId } });
    if (!exists) {
      throw new NotFoundException('Match not found');
    }
  }
}
