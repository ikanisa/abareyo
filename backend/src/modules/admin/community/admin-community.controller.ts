import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CommunityService } from '../../community/community.service.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { ModeratePostDto } from '../../community/dto/moderate-post.dto.js';
import { CreateQuizDto } from '../../community/dto/create-quiz.dto.js';
import { SchedulePredictionDto } from '../../community/dto/schedule-prediction.dto.js';

@Controller('admin/community')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminCommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('moderation')
  @RequireAdminPermissions('post:moderate')
  async moderation() {
    const data = await this.communityService.listFlagged();
    return { data };
  }

  @Post('posts/:postId/moderate')
  @RequireAdminPermissions('post:moderate')
  async moderate(
    @Param('postId', new ParseUUIDPipe()) postId: string,
    @Body() body: ModeratePostDto,
  ) {
    const data = await this.communityService.moderatePost(postId, body.status);
    return { data };
  }

  @Get('analytics')
  @RequireAdminPermissions('post:moderate')
  async analytics() {
    const data = await this.communityService.analytics();
    return { data };
  }

  @Get('missions')
  @RequireAdminPermissions('community:post:schedule')
  async adminMissions() {
    const data = await this.communityService.adminMissionsOverview();
    return { data };
  }

  @Post('quizzes')
  @RequireAdminPermissions('community:post:schedule')
  @HttpCode(HttpStatus.CREATED)
  async createQuiz(@Body() body: CreateQuizDto) {
    const data = await this.communityService.createQuiz(body);
    return { data };
  }

  @Post('quizzes/:quizId/close')
  @RequireAdminPermissions('community:post:schedule')
  async closeQuiz(@Param('quizId', new ParseUUIDPipe()) quizId: string) {
    const data = await this.communityService.closeQuiz(quizId);
    return { data };
  }

  @Post('predictions')
  @RequireAdminPermissions('community:post:schedule')
  @HttpCode(HttpStatus.CREATED)
  async schedulePrediction(@Body() body: SchedulePredictionDto) {
    const data = await this.communityService.schedulePrediction(body);
    return { data };
  }

  @Post('predictions/:predictionId/close')
  @RequireAdminPermissions('community:post:schedule')
  async closePrediction(@Param('predictionId', new ParseUUIDPipe()) predictionId: string) {
    const data = await this.communityService.closePrediction(predictionId);
    return { data };
  }
}

