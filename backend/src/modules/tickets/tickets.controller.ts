import {
  BadRequestException,
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
import { TicketsService } from './tickets.service.js';
import { TicketCheckoutDto } from './dto/create-checkout.dto.js';
import { TicketPassVerifyDto } from './dto/ticket-pass-verify.dto.js';
import { InitiateTransferDto } from './dto/initiate-transfer.dto.js';
import { ClaimTransferDto } from './dto/claim-transfer.dto.js';
import { RotatePassDto } from './dto/rotate-pass.dto.js';
import { CancelTicketOrderDto } from './dto/cancel-order.dto.js';
import { SmsService } from '../sms/sms.service.js';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly smsService: SmsService,
  ) {}

  @Get('catalog')
  async catalog() {
    const data = await this.ticketsService.getTicketCatalog();
    return { data };
  }

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Body() body: TicketCheckoutDto) {
    const result = await this.ticketsService.createPendingOrder(body);
    return { data: result };
  }

  @Get('orders/:orderId')
  async getOrder(@Param('orderId') orderId: string) {
    const order = await this.ticketsService.getOrderSnapshot(orderId);
    return { data: order };
  }

  @Get('orders')
  async listOrders(@Query('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.ticketsService.listOrdersForUser(userId);
    return { data };
  }

  @Post('orders/:orderId/cancel')
  async cancelOrder(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() body: CancelTicketOrderDto,
  ) {
    const data = await this.ticketsService.cancelPendingOrder(orderId, body.userId);
    return { data };
  }

  @Get('orders/:orderId/receipt')
  async orderReceipt(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Query('userId', new ParseUUIDPipe()) userId: string,
  ) {
    const data = await this.ticketsService.getOrderReceipt(orderId, userId);
    return { data };
  }

  @Get('passes')
  async listPasses(@Query('userId') userId?: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const data = await this.ticketsService.listActivePasses(userId);
    return { data };
  }

  @Post('verify-pass')
  async verifyPass(@Body() body: TicketPassVerifyDto, @Query('dryRun') dryRun?: string) {
    const result = await this.ticketsService.verifyPassToken(body.token, {
      dryRun: dryRun === 'true',
      stewardId: body.stewardId,
    });
    return { data: result };
  }

  @Post('passes/rotate')
  async rotatePass(@Body() body: RotatePassDto) {
    const data = await this.ticketsService.rotatePassToken(body);
    return { data };
  }

  @Post('passes/initiate-transfer')
  @HttpCode(HttpStatus.CREATED)
  async initiateTransfer(@Body() body: InitiateTransferDto) {
    const data = await this.ticketsService.initiateTransfer(body);
    return { data };
  }

  @Post('passes/claim-transfer')
  async claimTransfer(@Body() body: ClaimTransferDto) {
    const data = await this.ticketsService.claimTransfer(body);
    return { data };
  }

  @Get('gate/history')
  async gateHistory(@Headers('x-admin-token') adminToken?: string) {
    if (!this.smsService.validateAdminToken(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }
    const data = await this.ticketsService.listGateHistory();
    return { data };
  }

  @Get('analytics')
  async analytics(@Headers('x-admin-token') adminToken?: string) {
    if (!this.smsService.validateAdminToken(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }
    const data = await this.ticketsService.analytics();
    return { data };
  }
}
