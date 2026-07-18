import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.shop.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  create(data: { name: string; whatsappNumber?: string; avgServiceTime?: number }) {
    return this.prisma.shop.create({ data });
  }
}
