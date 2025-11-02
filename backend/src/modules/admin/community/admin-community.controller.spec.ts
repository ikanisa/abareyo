import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';

import { CommunityService } from '../../community/community.service.js';
import { CreateQuizDto } from '../../community/dto/create-quiz.dto.js';
import { ModeratePostDto } from '../../community/dto/moderate-post.dto.js';
import { SchedulePredictionDto } from '../../community/dto/schedule-prediction.dto.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { REQUIRED_ADMIN_PERMISSIONS_KEY } from '../rbac/permissions.decorator.js';
import { AdminCommunityController } from './admin-community.controller.js';

describe('AdminCommunityController', () => {
  let controller: AdminCommunityController;
  const communityService = {
    listFlagged: jest.fn(),
    moderatePost: jest.fn(),
    analytics: jest.fn(),
    adminMissionsOverview: jest.fn(),
    createQuiz: jest.fn(),
    closeQuiz: jest.fn(),
    schedulePrediction: jest.fn(),
    closePrediction: jest.fn(),
  } satisfies Partial<CommunityService> as CommunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCommunityController],
      providers: [{ provide: CommunityService, useValue: communityService }],
    }).compile();

    controller = module.get(AdminCommunityController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('applies admin guards to the controller', () => {
    const guards = Reflect.getMetadata('__guards__', AdminCommunityController) ?? [];

    expect(guards).toEqual(expect.arrayContaining([AdminSessionGuard, AdminPermissionsGuard]));
  });

  it('fetches moderation queue with correct permission', async () => {
    communityService.listFlagged = jest.fn().mockResolvedValue([{ id: 'post-1' }]);
    const metadata = Reflect.getMetadata(
      REQUIRED_ADMIN_PERMISSIONS_KEY,
      AdminCommunityController.prototype.moderation,
    ) as string[];
    expect(metadata).toEqual(expect.arrayContaining(['post:moderate']));

    const response = await controller.moderation();
    expect(response.data).toEqual([{ id: 'post-1' }]);
  });

  it('moderates posts', async () => {
    communityService.moderatePost = jest.fn().mockResolvedValue({ id: 'post-1', status: 'hidden' });
    const body = { status: 'hidden' } satisfies ModeratePostDto;

    const result = await controller.moderate('c0f9a8f3-5e60-47dc-8bb2-2c3ab6f37970', body);

    expect(communityService.moderatePost).toHaveBeenCalledWith(
      'c0f9a8f3-5e60-47dc-8bb2-2c3ab6f37970',
      'hidden',
    );
    expect(result.data.status).toBe('hidden');
  });

  it('creates quizzes with scheduling permissions', async () => {
    communityService.createQuiz = jest.fn().mockResolvedValue({ id: 'quiz-1' });
    const dto = { title: 'Quiz', options: ['a', 'b'], expiresAt: null } satisfies CreateQuizDto;

    const metadata = Reflect.getMetadata(
      REQUIRED_ADMIN_PERMISSIONS_KEY,
      AdminCommunityController.prototype.createQuiz,
    ) as string[];
    expect(metadata).toEqual(expect.arrayContaining(['community:post:schedule']));

    const response = await controller.createQuiz(dto);
    expect(response.data).toEqual({ id: 'quiz-1' });
  });

  it('closes predictions with scheduling permissions', async () => {
    communityService.closePrediction = jest.fn().mockResolvedValue({ id: 'pred-1', status: 'closed' });
    const metadata = Reflect.getMetadata(
      REQUIRED_ADMIN_PERMISSIONS_KEY,
      AdminCommunityController.prototype.closePrediction,
    ) as string[];
    expect(metadata).toEqual(expect.arrayContaining(['community:post:schedule']));

    const response = await controller.closePrediction('27f0fbd6-120e-49b8-a770-9a8aa2d79a1c');
    expect(response.data.status).toBe('closed');
  });

  it('schedules predictions', async () => {
    communityService.schedulePrediction = jest
      .fn()
      .mockResolvedValue({ id: 'pred-1', scheduledAt: '2025-01-01T00:00:00.000Z' });

    const dto = {
      title: 'Will we win?',
      closesAt: '2025-01-01T00:00:00.000Z',
      options: ['Yes', 'No'],
    } satisfies SchedulePredictionDto;

    const result = await controller.schedulePrediction(dto);

    expect(communityService.schedulePrediction).toHaveBeenCalledWith(dto);
    expect(result.data.id).toBe('pred-1');
  });
});
