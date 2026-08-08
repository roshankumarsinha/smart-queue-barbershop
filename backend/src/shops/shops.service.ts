import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Shop } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShopStatus } from '../common/constants';

// The shape returned to clients: `active` is projected to an OPEN/CLOSED status so
// the API talks in shop states rather than a raw boolean.
export interface ShopResponse {
  id: string;
  name: string;
  whatsappNumber: string | null;
  address: string | null;
  avgServiceTime: number;
  status: ShopStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  // Open shops only — a closed shop is still reachable via findOne.
  async findAll(): Promise<ShopResponse[]> {
    const shops = await this.prisma.shop.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    return shops.map(toResponse);
  }

  // Unlike the list, a closed shop is still reachable directly — staff need this to reopen it.
  async findOne(id: string): Promise<ShopResponse> {
    return toResponse(await this.requireShop(id));
  }

  // Rejects a WhatsApp number already claimed by another shop — customers reach a
  // shop through that number, so sharing one would route them to the wrong queue.
  async create(data: {
    name: string;
    whatsappNumber?: string;
    address?: string;
    avgServiceTime?: number;
  }): Promise<ShopResponse> {
    const whatsappNumber = data.whatsappNumber?.trim() || null;
    if (whatsappNumber) {
      const existing = await this.prisma.shop.findUnique({
        where: { whatsappNumber },
      });
      if (existing) {
        throw new ConflictException(
          'A shop with this WhatsApp number already exists',
        );
      }
    }

    const shop = await this.prisma.shop.create({
      data: {
        name: data.name,
        whatsappNumber,
        address: data.address?.trim() || null,
        avgServiceTime: data.avgServiceTime,
      },
    });
    return toResponse(shop);
  }

  // Closing hides the shop from findAll and stops it accepting new queue joins.
  async close(id: string): Promise<ShopResponse> {
    return this.setActive(id, false);
  }

  async open(id: string): Promise<ShopResponse> {
    return this.setActive(id, true);
  }

  private async setActive(id: string, active: boolean): Promise<ShopResponse> {
    await this.requireShop(id); // 404 if missing
    const shop = await this.prisma.shop.update({
      where: { id },
      data: { active },
    });
    return toResponse(shop);
  }

  private async requireShop(id: string): Promise<Shop> {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }
}

function toResponse(shop: Shop): ShopResponse {
  return {
    id: shop.id,
    name: shop.name,
    whatsappNumber: shop.whatsappNumber,
    address: shop.address,
    avgServiceTime: shop.avgServiceTime,
    status: shop.active ? ShopStatus.OPEN : ShopStatus.CLOSED,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
}
