import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { ShopCheckoutDto } from './dto/shop-checkout.dto.js';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return products.map((product) => {
      const assets = this.storage.normaliseImages(product.images);
      return {
        ...product,
        images: assets,
        thumbnailUrl: assets[0]?.url ?? null,
      };
    });
  }

  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    const assets = this.storage.normaliseImages(product.images);
    return {
      ...product,
      images: assets,
      thumbnailUrl: assets[0]?.url ?? null,
    };
  }

  async checkout(dto: ShopCheckoutDto) {
    await this.ensureUser(dto.userId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((item) => item.productId) }, isActive: true },
    });

    const productMap = new Map<string, (typeof products)[number]>(
      products.map((product) => [product.id, product]),
    );

    const totals = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} unavailable`);
      }
      return {
        product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      };
    });

    const total = totals.reduce((sum, entry) => sum + entry.lineTotal, 0);
    const ussdCode = this.buildUssdString(dto.channel, total);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId ?? null,
        total,
        status: 'pending',
        shippingAddress: dto.contactName || dto.contactPhone
          ? {
              contactName: dto.contactName,
              contactPhone: dto.contactPhone,
            }
          : null,
        items: {
          create: totals.map((entry) => ({
            productId: entry.product.id,
            qty: entry.quantity,
            price: entry.product.price,
          })),
        },
        payments: {
          create: {
            kind: 'shop',
            amount: total,
            status: 'pending',
          },
        },
      },
      include: { payments: true },
    });

    return {
      orderId: order.id,
      paymentId: order.payments[0]?.id,
      total,
      ussdCode,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async ensureUser(userId?: string) {
    if (!userId) {
      return;
    }

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
