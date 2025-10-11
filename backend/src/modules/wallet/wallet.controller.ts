import { Controller, Get, Query } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';

import { WalletService } from './wallet.service.js';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('summary')
  async summary(@Query('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.walletService.getSummary(userId);
    return { data };
  }

  @Get('transactions')
  async transactions(@Query('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.walletService.getTransactions(userId);
    return { data };
  }
}
