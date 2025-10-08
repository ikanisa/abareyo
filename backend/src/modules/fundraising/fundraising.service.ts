import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { DonateDto } from './dto/donate.dto.js';

@Injectable()
export class FundraisingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async listProjects() {
    const projects = await this.prisma.fundProject.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((project) => ({
      ...project,
      coverImageUrl: this.storage.getPublicUrl(project.coverImage ?? undefined),
    }));
  }

  async getProject(projectId: string) {
    const project = await this.prisma.fundProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return {
      ...project,
      coverImageUrl: this.storage.getPublicUrl(project.coverImage ?? undefined),
    };
  }

  async donate(dto: DonateDto) {
    await this.ensureUser(dto.userId);

    const project = await this.prisma.fundProject.findUnique({ where: { id: dto.projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const projectWithAsset = {
      ...project,
      coverImageUrl: this.storage.getPublicUrl(project.coverImage ?? undefined),
    };

    const ussdCode = this.buildUssdString(dto.channel, dto.amount);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const donation = await this.prisma.fundDonation.create({
      data: {
        projectId: dto.projectId,
        userId: dto.userId ?? null,
        amount: dto.amount,
        status: 'pending',
        payments: {
          create: {
            kind: 'donation',
            amount: dto.amount,
            status: 'pending',
            metadata: dto.donorName ? { donorName: dto.donorName } : undefined,
          },
        },
      },
      include: { payments: true },
    });

    return {
      donationId: donation.id,
      paymentId: donation.payments[0]?.id,
      project: projectWithAsset,
      amount: dto.amount,
      ussdCode,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async ensureUser(userId?: string) {
    if (!userId) return;
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        locale: 'rw',
      },
    });
  }

  private buildUssdString(channel: 'mtn' | 'airtel', amount: number) {
    const payments = this.configService.get('payments');
    const shortcode = channel === 'airtel' ? payments.airtelPayCode : payments.mtnPayCode;
    const formattedAmount = Math.max(amount, 0);
    const hash = '%23';
    return `*182*1*${shortcode}*${formattedAmount}${hash}`;
  }
}
