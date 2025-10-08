import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { ReactPostDto } from './dto/react-post.dto.js';
import { CreatePollDto } from './dto/create-poll.dto.js';
import { VotePollDto } from './dto/vote-poll.dto.js';
import { CheckInDto } from './dto/check-in.dto.js';
import { QuizSubmissionDto } from './dto/quiz.dto.js';
import { PredictionDto } from './dto/prediction.dto.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { SchedulePredictionDto } from './dto/schedule-prediction.dto.js';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  private flaggedKeywords = [/https?:\/\//i, /spam/i, /bet/i];
  private readonly guestId = '00000000-0000-0000-0000-000000000001';

  constructor(private readonly prisma: PrismaService) {}

  async listFeed(limit = 30) {
    const posts = await this.prisma.post.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: true,
        reactions: true,
        comments: { select: { id: true } },
        poll: {
          include: {
            options: {
              include: { votes: true },
            },
          },
        },
      },
    });

    return posts.map(({ reactions, comments, poll, ...rest }) => {
      const reactionTotals = reactions.reduce((acc: Record<string, number>, reaction) => {
        acc[reaction.kind] = (acc[reaction.kind] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...rest,
        riskTerms: this.extractRiskTerms(rest.content),
        reactionTotals,
        commentCount: comments.length,
        poll: poll ? this.mapPoll(poll) : null,
      };
    });
  }

  async createPost(dto: CreatePostDto) {
    const authorId = await this.ensureAuthor(dto.userId);
    const status = this.shouldFlag(dto.content) ? 'flagged' : 'published';

    const post = await this.prisma.post.create({
      data: {
        authorId,
        content: dto.content,
        status,
        media: dto.media ?? null,
      },
      include: { author: true },
    });

    if (status === 'flagged') {
      this.logger.warn(`Post ${post.id} flagged for moderation`);
    }

    let poll = null;
    if (dto.pollOptions?.length) {
      poll = await this.createPoll({
        userId: dto.userId,
        question: dto.content,
        options: dto.pollOptions,
        postId: post.id,
      });
    }

    return {
      ...post,
      reactionTotals: {},
      commentCount: 0,
      riskTerms: this.extractRiskTerms(post.content),
      poll,
    };
  }

  async listFlagged(limit = 50) {
    return this.prisma.post.findMany({
      where: { status: 'flagged' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: true },
    });
  }

  async listPolls(limit = 10) {
    const polls = await this.prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        options: {
          include: { votes: true },
        },
      },
    });

    return polls.map((poll) => this.mapPoll(poll));
  }

  async createPoll(dto: CreatePollDto) {
    const authorId = await this.ensureAuthor(dto.userId);

    if (dto.postId) {
      await this.ensurePostExists(dto.postId);
    }

    const trimmedQuestion = dto.question.trim();
    if (!trimmedQuestion) {
      throw new BadRequestException('Poll question cannot be empty');
    }

    const uniqueOptions = Array.from(
      new Set((dto.options ?? []).map((option) => option.trim()).filter(Boolean)),
    );

    if (uniqueOptions.length < 2) {
      throw new BadRequestException('At least two unique poll options are required');
    }

    const poll = await this.prisma.poll.create({
      data: {
        question: trimmedQuestion,
        authorId,
        post: dto.postId ? { connect: { id: dto.postId } } : undefined,
        options: {
          create: uniqueOptions.map((label) => ({ label })),
        },
      },
      include: {
        options: {
          include: { votes: true },
        },
      },
    });

    return this.mapPoll(poll);
  }

  async vote(dto: VotePollDto) {
    const userId = await this.ensureAuthor(dto.userId);

    const option = await this.prisma.pollOption.findFirst({
      where: {
        id: dto.optionId,
        pollId: dto.pollId,
      },
      select: { id: true },
    });

    if (!option) {
      throw new BadRequestException('Option does not belong to the specified poll');
    }

    await this.prisma.pollVote.upsert({
      where: {
        pollId_userId: {
          pollId: dto.pollId,
          userId,
        },
      },
      create: {
        pollId: dto.pollId,
        optionId: dto.optionId,
        userId,
      },
      update: {
        optionId: dto.optionId,
      },
    });

    const poll = await this.prisma.poll.findUnique({
      where: { id: dto.pollId },
      include: {
        options: {
          include: { votes: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return this.mapPoll(poll);
  }

  async moderatePost(postId: string, status: 'published' | 'removed') {
    const post = await this.prisma.post.update({
      where: { id: postId },
      data: { status },
      include: { author: true },
    }).catch(() => {
      throw new NotFoundException('Post not found');
    });

    return post;
  }

  async createComment(dto: CreateCommentDto) {
    const authorId = await this.ensureAuthor(dto.userId);
    await this.ensurePostExists(dto.postId);
    const comment = await this.prisma.postComment.create({
      data: {
        postId: dto.postId,
        authorId,
        content: dto.content,
      },
    });

    return comment;
  }

  async reactToPost(dto: ReactPostDto) {
    const userId = await this.ensureAuthor(dto.userId);
    await this.ensurePostExists(dto.postId);
    const existing = await this.prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId: dto.postId,
          userId,
        },
      },
    });

    if (existing && existing.kind === dto.kind) {
      await this.prisma.postReaction.delete({
        where: {
          postId_userId: {
            postId: dto.postId,
            userId,
          },
        },
      });
    } else {
      await this.prisma.postReaction.upsert({
        where: {
          postId_userId: {
            postId: dto.postId,
            userId,
          },
        },
        create: {
          postId: dto.postId,
          userId,
          kind: dto.kind,
        },
        update: {
          kind: dto.kind,
        },
      });
    }

    const totals = await this.aggregateReactions(dto.postId);
    return { postId: dto.postId, reactionTotals: totals };
  }

  async recordView(postId: string) {
    await this.ensurePostExists(postId);
    await this.prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async analytics() {
    const [totalPosts, flaggedPosts, reactionCount, commentCount] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: 'flagged' } }),
      this.prisma.postReaction.count(),
      this.prisma.postComment.count(),
    ]);

    const topPosts = await this.prisma.post.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        viewCount: true,
        reactions: true,
      },
    });

    const topPostSummaries = topPosts.map((post) => ({
      id: post.id,
      snippet: post.content.slice(0, 60),
      viewCount: post.viewCount,
      reactions: post.reactions.length,
    }));

    return {
      totals: {
        posts: totalPosts,
        flagged: flaggedPosts,
        reactions: reactionCount,
        comments: commentCount,
      },
      topPosts: topPostSummaries,
    };
  }

  async leaderboard(period: 'weekly' | 'monthly' = 'weekly') {
    const start = this.getPeriodStart(period);

    const events = await this.prisma.gamificationEvent.groupBy({
      by: ['userId'],
      where: {
        occurredAt: {
          gte: start,
        },
      },
      _sum: { value: true },
    });

    if (!events.length) {
      return [];
    }

    const sorted = events
      .map((event) => ({
        userId: event.userId,
        points: event._sum.value ?? 0,
      }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);

    const users = await this.prisma.user.findMany({
      where: { id: { in: sorted.map((entry) => entry.userId) } },
      select: {
        id: true,
        locale: true,
        status: true,
        preferredZone: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return sorted.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      points: entry.points,
      user: userMap.get(entry.userId) ?? null,
    }));
  }

  async checkIn(dto: CheckInDto) {
    const userId = await this.ensureAuthor(dto.userId);
    const startOfDay = this.getStartOfDay();

    const existing = await this.prisma.gamificationEvent.findFirst({
      where: {
        userId,
        kind: 'checkin',
        occurredAt: { gte: startOfDay },
      },
    });

    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    const event = await this.recordGamificationEvent(userId, 'checkin', 10, {
      location: dto.location ?? null,
    });

    const totalPoints = await this.getUserTotalPoints(userId);

    return {
      userId,
      kind: 'checkin' as const,
      pointsAwarded: event.value,
      totalPoints,
    };
  }

  async submitQuiz(dto: QuizSubmissionDto) {
    const userId = await this.ensureAuthor(dto.userId);

    const quiz = await this.findActiveQuiz(dto.quizId);

    const existing = await this.prisma.gamificationEvent.findFirst({
      where: {
        userId,
        kind: 'quiz',
      },
      orderBy: { occurredAt: 'desc' },
    });

    if (existing?.context && typeof existing.context === 'object' && 'quizId' in existing.context) {
      // When Prisma returns JsonValue as any
      const quizId = (existing.context as Record<string, unknown>).quizId;
      if (quizId === dto.quizId) {
        throw new BadRequestException('Quiz already submitted');
      }
    }

    const event = await this.recordGamificationEvent(userId, 'quiz', quiz.rewardPoints, {
      quizId: dto.quizId,
      answer: dto.answer,
    });

    const totalPoints = await this.getUserTotalPoints(userId);

    return {
      userId,
      kind: 'quiz' as const,
      pointsAwarded: event.value,
      totalPoints,
    };
  }

  async submitPrediction(dto: PredictionDto) {
    const userId = await this.ensureAuthor(dto.userId);

    const fixture = await this.findOpenPrediction(dto.matchId);

    const existing = await this.prisma.gamificationEvent.findFirst({
      where: {
        userId,
        kind: 'prediction',
      },
      orderBy: { occurredAt: 'desc' },
    });

    if (existing?.context && typeof existing.context === 'object' && 'matchId' in existing.context) {
      const matchId = (existing.context as Record<string, unknown>).matchId;
      if (matchId === dto.matchId) {
        await this.prisma.gamificationEvent.update({
          where: { id: existing.id },
          data: {
            context: {
              ...((existing.context ?? {}) as Record<string, unknown>),
              matchId: dto.matchId,
              pick: dto.pick,
            },
          },
        });
        const totalPoints = await this.getUserTotalPoints(userId);
        return {
          userId,
          kind: 'prediction' as const,
          pointsAwarded: 0,
          totalPoints,
        };
      }
    }

    const event = await this.recordGamificationEvent(userId, 'prediction', fixture.rewardPoints, {
      matchId: dto.matchId,
      pick: dto.pick,
    });

    const totalPoints = await this.getUserTotalPoints(userId);

    return {
      userId,
      kind: 'prediction' as const,
      pointsAwarded: event.value,
      totalPoints,
    };
  }

  private shouldFlag(content: string) {
    return this.flaggedKeywords.some((pattern) => pattern.test(content));
  }

  private extractRiskTerms(content: string) {
    return this.flaggedKeywords.filter((pattern) => pattern.test(content)).map((pattern) => pattern.source);
  }

  private async ensureAuthor(userId?: string) {
    const id = userId ?? this.guestId;
    await this.prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        locale: 'rw',
      },
    });
    return id;
  }

  private async ensurePostExists(postId: string) {
    const exists = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!exists) {
      throw new NotFoundException('Post not found');
    }
  }

  private async aggregateReactions(postId: string) {
    const reactions = await this.prisma.postReaction.findMany({
      where: { postId },
      select: { kind: true },
    });
    return reactions.reduce((acc: Record<string, number>, reaction) => {
      acc[reaction.kind] = (acc[reaction.kind] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private mapPoll(poll: PollWithVotes) {
    const options = poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      votes: option.votes.length,
    }));

    const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

    return {
      id: poll.id,
      postId: poll.postId ?? null,
      question: poll.question,
      createdAt: poll.createdAt.toISOString(),
      options,
      totalVotes,
    };
  }

  private getPeriodStart(period: 'weekly' | 'monthly') {
    const now = new Date();
    if (period === 'monthly') {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    }
    const day = now.getUTCDay() || 7; // convert Sunday (0) to 7
    const diff = day - 1; // Monday start
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    start.setUTCDate(start.getUTCDate() - diff);
    return start;
  }

  private getStartOfDay() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }

  private async getUserTotalPoints(userId: string) {
    const aggregate = await this.prisma.gamificationEvent.aggregate({
      _sum: { value: true },
      where: { userId },
    });
    return aggregate._sum.value ?? 0;
  }

  private recordGamificationEvent(
    userId: string,
    kind: Prisma.GamificationKind,
    value: number,
    context: Prisma.InputJsonValue,
  ) {
    return this.prisma.gamificationEvent.create({
      data: {
        userId,
        kind,
        value,
        context,
      },
    });
  }

  async getMissions() {
    const now = new Date();
    const [quiz, prediction] = await Promise.all([
      this.prisma.quiz.findFirst({
        where: {
          activeFrom: { lte: now },
          OR: [{ activeUntil: null }, { activeUntil: { gte: now } }],
        },
        orderBy: { activeFrom: 'desc' },
      }),
      this.prisma.predictionFixture.findFirst({
        where: { deadline: { gt: now } },
        orderBy: { deadline: 'asc' },
        include: {
          match: {
            select: {
              id: true,
              opponent: true,
              kickoff: true,
              venue: true,
            },
          },
        },
      }),
    ]);

    return {
      quiz: quiz
        ? {
            id: quiz.id,
            prompt: quiz.prompt,
            rewardPoints: quiz.rewardPoints,
            activeUntil: quiz.activeUntil?.toISOString() ?? null,
          }
        : null,
      prediction: prediction
        ? {
            id: prediction.id,
            matchId: prediction.matchId,
            question: prediction.question,
            rewardPoints: prediction.rewardPoints,
            deadline: prediction.deadline.toISOString(),
            match: prediction.match
              ? {
                  opponent: prediction.match.opponent,
                  kickoff: prediction.match.kickoff.toISOString(),
                  venue: prediction.match.venue,
                }
              : null,
          }
        : null,
    };
  }

  private async findActiveQuiz(quizId: string) {
    const now = new Date();
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        activeFrom: { lte: now },
        OR: [{ activeUntil: null }, { activeUntil: { gte: now } }],
      },
    });

    if (!quiz) {
      throw new BadRequestException('Quiz is not active');
    }

    return quiz;
  }

  private async findOpenPrediction(matchId: string) {
    const now = new Date();
    const fixture = await this.prisma.predictionFixture.findFirst({
      where: {
        matchId,
        deadline: { gt: now },
      },
    });

    if (!fixture) {
      throw new BadRequestException('Prediction window closed');
    }

    return fixture;
  }

  async listQuizzes(limit = 20) {
    const quizzes = await this.prisma.quiz.findMany({
      orderBy: { activeFrom: 'desc' },
      take: limit,
    });

    return quizzes.map((quiz) => ({
      id: quiz.id,
      prompt: quiz.prompt,
      correctAnswer: quiz.correctAnswer,
      rewardPoints: quiz.rewardPoints,
      activeFrom: quiz.activeFrom.toISOString(),
      activeUntil: quiz.activeUntil?.toISOString() ?? null,
      createdAt: quiz.createdAt.toISOString(),
    }));
  }

  async createQuiz(dto: CreateQuizDto) {
    const rewardPoints = dto.rewardPoints ?? 20;
    const activeFrom = dto.activeFrom ? new Date(dto.activeFrom) : new Date();
    const activeUntil = dto.activeUntil ? new Date(dto.activeUntil) : null;

    if (activeUntil && activeUntil <= activeFrom) {
      throw new BadRequestException('activeUntil must be after activeFrom');
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        prompt: dto.prompt.trim(),
        correctAnswer: dto.correctAnswer.trim(),
        rewardPoints,
        activeFrom,
        activeUntil,
      },
    });

    return {
      id: quiz.id,
      prompt: quiz.prompt,
      correctAnswer: quiz.correctAnswer,
      rewardPoints: quiz.rewardPoints,
      activeFrom: quiz.activeFrom.toISOString(),
      activeUntil: quiz.activeUntil?.toISOString() ?? null,
    };
  }

  async closeQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { activeUntil: new Date() },
    }).catch(() => {
      throw new NotFoundException('Quiz not found');
    });

    return {
      id: quiz.id,
      activeUntil: quiz.activeUntil?.toISOString() ?? new Date().toISOString(),
    };
  }

  async listPredictionFixtures(limit = 20) {
    const fixtures = await this.prisma.predictionFixture.findMany({
      orderBy: { deadline: 'desc' },
      take: limit,
      include: {
        match: {
          select: {
            opponent: true,
            kickoff: true,
            venue: true,
          },
        },
      },
    });

    return fixtures.map((fixture) => ({
      id: fixture.id,
      matchId: fixture.matchId,
      question: fixture.question,
      rewardPoints: fixture.rewardPoints,
      deadline: fixture.deadline.toISOString(),
      createdAt: fixture.createdAt.toISOString(),
      match: fixture.match
        ? {
            opponent: fixture.match.opponent,
            kickoff: fixture.match.kickoff.toISOString(),
            venue: fixture.match.venue,
          }
        : null,
    }));
  }

  async schedulePrediction(dto: SchedulePredictionDto) {
    const match = await this.prisma.match.findUnique({ where: { id: dto.matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const deadline = new Date(dto.deadline);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    const rewardPoints = dto.rewardPoints ?? 15;

    const fixture = await this.prisma.predictionFixture.create({
      data: {
        matchId: dto.matchId,
        question: dto.question.trim(),
        rewardPoints,
        deadline,
      },
      include: {
        match: {
          select: { opponent: true, kickoff: true, venue: true },
        },
      },
    });

    return {
      id: fixture.id,
      matchId: fixture.matchId,
      question: fixture.question,
      rewardPoints: fixture.rewardPoints,
      deadline: fixture.deadline.toISOString(),
      match: fixture.match
        ? {
            opponent: fixture.match.opponent,
            kickoff: fixture.match.kickoff.toISOString(),
            venue: fixture.match.venue,
          }
        : null,
    };
  }

  async closePrediction(predictionId: string) {
    const fixture = await this.prisma.predictionFixture.update({
      where: { id: predictionId },
      data: { deadline: new Date() },
    }).catch(() => {
      throw new NotFoundException('Prediction fixture not found');
    });

    return {
      id: fixture.id,
      deadline: fixture.deadline.toISOString(),
    };
  }

  async adminMissionsOverview() {
    const [quizzes, predictions, analytics] = await Promise.all([
      this.listQuizzes(25),
      this.listPredictionFixtures(25),
      this.computeMissionAnalytics(),
    ]);

    return {
      quizzes,
      predictions,
      analytics,
    };
  }

  private async computeMissionAnalytics() {
    const startOfDay = this.getStartOfDay();
    const grouped = await this.prisma.gamificationEvent.groupBy({
      by: ['kind'],
      where: {
        occurredAt: { gte: startOfDay },
        kind: { in: ['checkin', 'quiz', 'prediction'] },
      },
      _count: { _all: true },
    });

    const totals = grouped.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.kind] = entry._count._all;
      return acc;
    }, {});

    return {
      checkInsToday: totals.checkin ?? 0,
      quizSubmissionsToday: totals.quiz ?? 0,
      predictionsToday: totals.prediction ?? 0,
    };
  }
}

type PollWithVotes = Prisma.PollGetPayload<{
  include: {
    options: {
      include: { votes: true };
    };
  };
}>;
