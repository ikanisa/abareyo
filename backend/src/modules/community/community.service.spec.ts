import { BadRequestException } from '@nestjs/common';

import { CommunityService } from './community.service';
import type { PrismaService } from '../../prisma/prisma.service';

const fixedDate = new Date('2025-02-05T10:00:00Z');

describe('CommunityService – Polls', () => {
  const createService = () => {
    const prismaMock = {
      user: {
        upsert: jest.fn().mockResolvedValue({ id: 'user-guest' }),
      },
      post: {
        findUnique: jest.fn().mockResolvedValue({ id: 'post-1' }),
      },
      poll: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      pollOption: {
        findFirst: jest.fn(),
      },
      pollVote: {
        upsert: jest.fn(),
      },
      postReaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const service = new CommunityService(prismaMock);

    return { service, prismaMock };
  };

  it('creates polls with trimmed question, unique options, and optional post linkage', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.poll.create as jest.Mock).mockResolvedValue({
      id: 'poll-1',
      question: 'Favourite player?',
      createdAt: fixedDate,
      postId: 'post-1',
      options: [
        { id: 'opt-1', label: 'Option A', votes: [] },
        { id: 'opt-2', label: 'Option B', votes: [{ id: 'vote-1' }] },
      ],
    });

    const result = await service.createPoll({
      question: '  Favourite player?  ',
      options: [' Option A ', 'Option B', 'Option A'],
      postId: 'post-1',
      userId: 'user-123',
    });

    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({ where: { id: 'post-1' } });
    expect(prismaMock.poll.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          question: 'Favourite player?',
          authorId: 'user-123',
          post: { connect: { id: 'post-1' } },
          options: {
            create: [{ label: 'Option A' }, { label: 'Option B' }],
          },
        },
      }),
    );

    expect(result).toEqual({
      id: 'poll-1',
      postId: 'post-1',
      question: 'Favourite player?',
      createdAt: fixedDate.toISOString(),
      options: [
        { id: 'opt-1', label: 'Option A', votes: 0 },
        { id: 'opt-2', label: 'Option B', votes: 1 },
      ],
      totalVotes: 1,
    });
  });

  it('rejects poll creation when fewer than two unique options remain', async () => {
    const { service, prismaMock } = createService();

    await expect(
      service.createPoll({ question: 'Duplicate test', options: [' Same ', 'Same'] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.poll.create).not.toHaveBeenCalled();
  });

  it('validates option ownership and returns updated tallies when voting', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.pollOption.findFirst as jest.Mock).mockResolvedValue({ id: 'opt-2' });
    (prismaMock.pollVote.upsert as jest.Mock).mockResolvedValue(null);
    (prismaMock.poll.findUnique as jest.Mock).mockResolvedValue({
      id: 'poll-1',
      question: 'Who starts?',
      createdAt: fixedDate,
      postId: null,
      options: [
        { id: 'opt-1', label: 'Player A', votes: [{ id: 'vote-1' }] },
        { id: 'opt-2', label: 'Player B', votes: [{ id: 'vote-2' }, { id: 'vote-3' }] },
      ],
    });

    const result = await service.vote({ pollId: 'poll-1', optionId: 'opt-2', userId: 'fan-7' });

    expect(prismaMock.pollOption.findFirst).toHaveBeenCalledWith({
      where: { id: 'opt-2', pollId: 'poll-1' },
      select: { id: true },
    });
    expect(prismaMock.pollVote.upsert).toHaveBeenCalledWith({
      where: {
        pollId_userId: {
          pollId: 'poll-1',
          userId: 'fan-7',
        },
      },
      create: {
        pollId: 'poll-1',
        optionId: 'opt-2',
        userId: 'fan-7',
      },
      update: {
        optionId: 'opt-2',
      },
    });
    expect(result).toEqual({
      id: 'poll-1',
      postId: null,
      question: 'Who starts?',
      createdAt: fixedDate.toISOString(),
      options: [
        { id: 'opt-1', label: 'Player A', votes: 1 },
        { id: 'opt-2', label: 'Player B', votes: 2 },
      ],
      totalVotes: 3,
    });
  });

  it('throws when voting for an option outside the poll', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.pollOption.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.vote({ pollId: 'poll-1', optionId: 'opt-x', userId: 'fan-9' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.pollVote.upsert).not.toHaveBeenCalled();
  });
});

describe('CommunityService – Leaderboard', () => {
  const createService = () => {
    const prismaMock = {
      gamificationEvent: {
        groupBy: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        aggregate: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'fan-guest' }),
      },
      quiz: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      predictionFixture: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const service = new CommunityService(prismaMock);

    return { service, prismaMock };
  };

  it('returns ranked entries for the selected period', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.gamificationEvent.groupBy as jest.Mock).mockResolvedValue([
      { userId: 'fan-1', _sum: { value: 120 } },
      { userId: 'fan-2', _sum: { value: 85 } },
      { userId: 'fan-3', _sum: { value: 0 } },
    ]);

    (prismaMock.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'fan-1', locale: 'rw', status: 'member', preferredZone: 'VIP' },
      { id: 'fan-2', locale: 'rw', status: 'guest', preferredZone: null },
    ]);

    const result = await service.leaderboard('weekly');

    expect(prismaMock.gamificationEvent.groupBy).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ rank: 1, userId: 'fan-1', points: 120 });
    expect(result[1]).toMatchObject({ rank: 2, userId: 'fan-2', points: 85 });
  });
});

describe('CommunityService – Engagement', () => {
  const createService = () => {
    const prismaMock = {
      gamificationEvent: {
        findFirst: jest.fn(),
        create: jest.fn(),
        aggregate: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        upsert: jest.fn().mockResolvedValue({ id: 'fan-1' }),
      },
      quiz: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      predictionFixture: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const service = new CommunityService(prismaMock);

    return { service, prismaMock };
  };

  it('awards points for the first check-in each day', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.gamificationEvent.findFirst as jest.Mock).mockResolvedValue(null);
    (prismaMock.gamificationEvent.create as jest.Mock).mockResolvedValue({
      id: 'evt-1',
      value: 10,
    });
    (prismaMock.gamificationEvent.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 50 } });

    const result = await service.checkIn({ userId: 'fan-1', location: 'Amahoro' });

    expect(result).toEqual({ userId: 'fan-1', kind: 'checkin', pointsAwarded: 10, totalPoints: 50 });
    expect(prismaMock.gamificationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kind: 'checkin', value: 10 }) }),
    );
  });

  it('blocks duplicate check-ins within the same day', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.gamificationEvent.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

    await expect(service.checkIn({ userId: 'fan-1' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records quiz submissions once per quiz', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.quiz.findFirst as jest.Mock).mockResolvedValue({
      id: 'weekly',
      rewardPoints: 20,
      activeUntil: null,
    });
    (prismaMock.gamificationEvent.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ context: { quizId: 'weekly' } });
    (prismaMock.gamificationEvent.create as jest.Mock).mockResolvedValue({ id: 'quiz-evt', value: 20 });
    (prismaMock.gamificationEvent.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 70 } });

    const first = await service.submitQuiz({ userId: 'fan-1', quizId: 'weekly', answer: 'Bimenyimana' });
    expect(first.pointsAwarded).toBe(20);

    await expect(service.submitQuiz({ userId: 'fan-1', quizId: 'weekly', answer: 'Another' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates predictions without double-counting points', async () => {
    const { service, prismaMock } = createService();

    const fixture = {
      id: 'fixture-1',
      matchId: 'match-1',
      rewardPoints: 15,
      deadline: new Date(Date.now() + 60 * 60 * 1000),
    };

    (prismaMock.predictionFixture.findFirst as jest.Mock).mockResolvedValue(fixture);
    (prismaMock.gamificationEvent.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'pred-evt', context: { matchId: 'match-1', pick: '2-0' } });
    (prismaMock.gamificationEvent.create as jest.Mock).mockResolvedValue({ id: 'pred-evt', value: 15 });
    (prismaMock.gamificationEvent.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 45 } });
    (prismaMock.gamificationEvent.update as jest.Mock).mockResolvedValue({ id: 'pred-evt' });

    const first = await service.submitPrediction({ userId: 'fan-1', matchId: 'match-1', pick: '2-0' });
    expect(first.pointsAwarded).toBe(15);

    const update = await service.submitPrediction({ userId: 'fan-1', matchId: 'match-1', pick: '3-1' });
    expect(update.pointsAwarded).toBe(0);
    expect(prismaMock.gamificationEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pred-evt' } }),
    );
  });

  it('returns missions with active quiz and prediction fixture', async () => {
    const { service, prismaMock } = createService();

    const now = new Date();
    (prismaMock.quiz.findFirst as jest.Mock).mockResolvedValue({
      id: 'quiz-1',
      prompt: 'Who scored?',
      rewardPoints: 25,
      activeUntil: new Date(now.getTime() + 60 * 60 * 1000),
    });
    (prismaMock.predictionFixture.findFirst as jest.Mock).mockResolvedValue({
      id: 'fixture-1',
      matchId: 'match-42',
      question: 'Final score?',
      rewardPoints: 30,
      deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      match: {
        opponent: 'APR FC',
        kickoff: now,
        venue: 'Amahoro',
      },
    });

    const missions = await service.getMissions();

    expect(missions.quiz).toMatchObject({ id: 'quiz-1', rewardPoints: 25 });
    expect(missions.prediction).toMatchObject({ id: 'fixture-1', rewardPoints: 30, matchId: 'match-42' });
  });

  it('creates and closes quizzes for admin', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.quiz.create as jest.Mock).mockResolvedValue({
      id: 'quiz-1',
      prompt: 'Favourite player?',
      correctAnswer: 'Player X',
      rewardPoints: 30,
      activeFrom: fixedDate,
      activeUntil: null,
      createdAt: fixedDate,
    });

    const created = await service.createQuiz({
      prompt: 'Favourite player?',
      correctAnswer: 'Player X',
      rewardPoints: 30,
      activeFrom: fixedDate.toISOString(),
    });

    expect(created).toMatchObject({ id: 'quiz-1', rewardPoints: 30 });
    (prismaMock.quiz.update as jest.Mock).mockResolvedValue({ id: 'quiz-1', activeUntil: fixedDate });

    const closed = await service.closeQuiz('quiz-1');
    expect(closed.id).toBe('quiz-1');
  });

  it('schedules and closes prediction fixtures', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.match.findUnique as jest.Mock).mockResolvedValue({ id: 'match-9' });
    (prismaMock.predictionFixture.create as jest.Mock).mockResolvedValue({
      id: 'fixture-9',
      matchId: 'match-9',
      question: 'Final score?',
      rewardPoints: 18,
      deadline: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: fixedDate,
      match: { opponent: 'APR', kickoff: fixedDate, venue: 'Amahoro' },
    });

    const fixture = await service.schedulePrediction({
      matchId: 'match-9',
      question: 'Final score?',
      rewardPoints: 18,
      deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    expect(fixture).toMatchObject({ id: 'fixture-9', rewardPoints: 18 });

    (prismaMock.predictionFixture.update as jest.Mock).mockResolvedValue({ id: 'fixture-9', deadline: fixedDate });
    const closed = await service.closePrediction('fixture-9');
    expect(closed.id).toBe('fixture-9');
  });

  it('returns admin missions overview with analytics', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.quiz.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'quiz-1',
        prompt: 'Q1',
        correctAnswer: 'Ans',
        rewardPoints: 20,
        activeFrom: fixedDate,
        activeUntil: null,
        createdAt: fixedDate,
      },
    ]);
    (prismaMock.predictionFixture.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'fixture-1',
        matchId: 'match-1',
        question: 'Score?',
        rewardPoints: 15,
        deadline: fixedDate,
        createdAt: fixedDate,
        match: { opponent: 'APR', kickoff: fixedDate, venue: 'Amahoro' },
      },
    ]);
    (prismaMock.gamificationEvent.groupBy as jest.Mock).mockResolvedValue([
      { kind: 'checkin', _count: { _all: 5 } },
      { kind: 'quiz', _count: { _all: 2 } },
    ]);

    const overview = await service.adminMissionsOverview();
    expect(overview.quizzes).toHaveLength(1);
    expect(overview.predictions).toHaveLength(1);
    expect(overview.analytics).toEqual({ checkInsToday: 5, quizSubmissionsToday: 2, predictionsToday: 0 });
  });
});
