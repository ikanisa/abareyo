import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ShopService } from './shop.service.js';
import { ShopCheckoutDto } from './dto/shop-checkout.dto.js';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  async products() {
    const data = await this.shopService.listProducts();
    return { data };
  }

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Body() body: ShopCheckoutDto) {
    const data = await this.shopService.checkout(body);
    return { data };
  }
}
