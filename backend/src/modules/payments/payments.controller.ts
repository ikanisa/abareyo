import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  private readonly adminToken?: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {
    this.adminToken = this.configService.get<string>('admin.apiToken');
  }

  private validateAdmin(token?: string) {
    return Boolean(token && this.adminToken && token === this.adminToken);
  }

  @Get('manual-review')
  async manualReview(@Headers('x-admin-token') adminToken?: string) {
    if (!this.validateAdmin(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }

    const data = await this.paymentsService.listManualReviewPayments();
    return { data };
  }
}
