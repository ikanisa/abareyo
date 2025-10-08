import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';

import { CommunityService } from './community.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { ModeratePostDto } from './dto/moderate-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { ReactPostDto } from './dto/react-post.dto.js';
import { CreatePollDto } from './dto/create-poll.dto.js';
import { VotePollDto } from './dto/vote-poll.dto.js';
import { CheckInDto } from './dto/check-in.dto.js';
import { QuizSubmissionDto } from './dto/quiz.dto.js';
import { PredictionDto } from './dto/prediction.dto.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { SchedulePredictionDto } from './dto/schedule-prediction.dto.js';
import { SmsService } from '../sms/sms.service.js';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly smsService: SmsService,
  ) {}

  @Get('feed')
  async feed() {
    const data = await this.communityService.listFeed();
    return { data };
  }

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreatePostDto) {
    const data = await this.communityService.createPost(body);
    return { data };
  }

  @Post('posts/:postId/comments')
  @HttpCode(HttpStatus.CREATED)
  async comment(
    @Param('postId', new ParseUUIDPipe()) postId: string,
    @Body() body: Omit<CreateCommentDto, 'postId'>,
  ) {
    const data = await this.communityService.createComment({ ...body, postId });
    return { data };
  }

  @Post('posts/:postId/react')
  async react(
    @Param('postId', new ParseUUIDPipe()) postId: string,
    @Body() body: Omit<ReactPostDto, 'postId'>,
  ) {
    const data = await this.communityService.reactToPost({ ...body, postId });
    return { data };
  }

  @Post('posts/:postId/view')
  @HttpCode(HttpStatus.ACCEPTED)
  async recordView(@Param('postId', new ParseUUIDPipe()) postId: string) {
    await this.communityService.recordView(postId);
    return { status: 'ok' };
  }

  @Get('polls')
  async polls() {
    const data = await this.communityService.listPolls();
    return { data };
  }

  @Post('polls')
  @HttpCode(HttpStatus.CREATED)
  async createPoll(@Body() body: CreatePollDto) {
    const data = await this.communityService.createPoll(body);
    return { data };
  }

  @Post('polls/:pollId/vote')
  async vote(
    @Param('pollId', new ParseUUIDPipe()) pollId: string,
    @Body() body: Omit<VotePollDto, 'pollId'>,
  ) {
    const data = await this.communityService.vote({ ...body, pollId });
    return { data };
  }

  @Get('moderation')
  async moderation(@Headers('x-admin-token') adminToken?: string) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.listFlagged();
    return { data };
  }

  @Post('posts/:postId/moderate')
  async moderate(
    @Param('postId', new ParseUUIDPipe()) postId: string,
    @Body() body: ModeratePostDto,
    @Headers('x-admin-token') adminToken?: string,
  ) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.moderatePost(postId, body.status);
    return { data };
  }

  @Get('analytics')
  async analytics(@Headers('x-admin-token') adminToken?: string) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.analytics();
    return { data };
  }

  @Get('leaderboard')
  async leaderboard(@Query('period') period?: 'weekly' | 'monthly') {
    const data = await this.communityService.leaderboard(period ?? 'weekly');
    return { data };
  }

  @Get('missions')
  async missions() {
    const data = await this.communityService.getMissions();
    return { data };
  }

  @Post('check-in')
  async checkIn(@Body() body: CheckInDto) {
    const data = await this.communityService.checkIn(body);
    return { data };
  }

  @Post('quiz')
  async submitQuiz(@Body() body: QuizSubmissionDto) {
    const data = await this.communityService.submitQuiz(body);
    return { data };
  }

  @Post('prediction')
  async submitPrediction(@Body() body: PredictionDto) {
    const data = await this.communityService.submitPrediction(body);
    return { data };
  }

  @Get('admin/missions')
  async adminMissions(@Headers('x-admin-token') adminToken?: string) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.adminMissionsOverview();
    return { data };
  }

  @Post('admin/quizzes')
  async createQuiz(
    @Body() body: CreateQuizDto,
    @Headers('x-admin-token') adminToken?: string,
  ) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.createQuiz(body);
    return { data };
  }

  @Post('admin/quizzes/:quizId/close')
  async closeQuiz(
    @Param('quizId', new ParseUUIDPipe()) quizId: string,
    @Headers('x-admin-token') adminToken?: string,
  ) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.closeQuiz(quizId);
    return { data };
  }

  @Post('admin/predictions')
  async schedulePrediction(
    @Body() body: SchedulePredictionDto,
    @Headers('x-admin-token') adminToken?: string,
  ) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.schedulePrediction(body);
    return { data };
  }

  @Post('admin/predictions/:predictionId/close')
  async closePrediction(
    @Param('predictionId', new ParseUUIDPipe()) predictionId: string,
    @Headers('x-admin-token') adminToken?: string,
  ) {
    this.ensureAdmin(adminToken);
    const data = await this.communityService.closePrediction(predictionId);
    return { data };
  }

  private ensureAdmin(adminToken?: string) {
    if (!this.smsService.validateAdminToken(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }
  }
}
