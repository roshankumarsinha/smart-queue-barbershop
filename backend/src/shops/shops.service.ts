import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Shop } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ShopStatus, ShopType, DEFAULT_SHOP_TYPE } from '../common/constants';
import type { AuthUser } from '../common/decorators/current-user.decorator';

// The shape returned to clients — mirrors the Java ShopResponse.
export interface ShopResponse {
  id: string;
  ownerId: string | null;
  name: string;
  type: string;
  whatsappNumber: string | null;
  phone: string | null;
  address: string | null;
  locationUrl: string | null;
  status: string;
  openingTime: string | null;
  closingTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShopInput {
  ownerId: string;
  name: string;
  type?: string;
  whatsappNumber?: string;
  phone?: string;
  address?: string;
  locationUrl?: string;
  openingTime?: string;
  closingTime?: string;
}

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  // Open shops only — NEW and CLOSED shops are still reachable via findOne / findByOwner.
  async findAll(): Promise<ShopResponse[]> {
    const shops = await this.prisma.shop.findMany({
      where: { status: ShopStatus.OPEN },
      orderBy: { createdAt: 'asc' },
    });
    return shops.map(toResponse);
  }

  // Every shop belonging to one owner, oldest first (all statuses).
  async findByOwner(ownerId: string): Promise<ShopResponse[]> {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    });
    return shops.map(toResponse);
  }

  countByOwner(ownerId: string): Promise<number> {
    return this.prisma.shop.count({ where: { ownerId } });
  }

  // Unlike the list, a NEW/CLOSED shop is still reachable directly.
  async findOne(id: string): Promise<ShopResponse> {
    return toResponse(await this.requireShop(id));
  }

  // Rejects a WhatsApp number already claimed by another shop — customers reach a
  // shop through that number, so sharing one would route them to the wrong queue.
  // A freshly registered shop starts NEW (an owner opens it later).
  async create(input: CreateShopInput): Promise<ShopResponse> {
    const whatsappNumber = input.whatsappNumber?.trim() || null;
    if (whatsappNumber) {
      const existing = await this.prisma.shop.findUnique({ where: { whatsappNumber } });
      if (existing) {
        throw new ConflictException('A shop with this WhatsApp number already exists');
      }
    }

    const shop = await this.prisma.shop.create({
      data: {
        ownerId: input.ownerId,
        name: input.name.trim(),
        type: (input.type as ShopType) ?? DEFAULT_SHOP_TYPE,
        whatsappNumber,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        locationUrl: input.locationUrl?.trim() || null,
        openingTime: input.openingTime?.trim() || null,
        closingTime: input.closingTime?.trim() || null,
        status: ShopStatus.NEW,
      },
    });
    return toResponse(shop);
  }

  // Closing hides the shop from findAll and stops it accepting new queue joins.
  async close(id: string, caller: AuthUser): Promise<ShopResponse> {
    return this.setStatus(id, ShopStatus.CLOSED, caller);
  }

  async open(id: string, caller: AuthUser): Promise<ShopResponse> {
    return this.setStatus(id, ShopStatus.OPEN, caller);
  }

  private async setStatus(
    id: string,
    status: ShopStatus,
    caller: AuthUser,
  ): Promise<ShopResponse> {
    const existing = await this.requireShop(id);
    // The role guard only proves the caller is *a* SHOP_OWNER; here we prove they own
    // *this* shop. Ownership lives on the shop (ownerId), checked against the caller's id.
    if (caller.role !== Role.SUPER_ADMIN && existing.ownerId !== caller.userId) {
      throw new ForbiddenException("Not this shop's owner");
    }
    const shop = await this.prisma.shop.update({ where: { id }, data: { status } });
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
    ownerId: shop.ownerId,
    name: shop.name,
    type: shop.type,
    whatsappNumber: shop.whatsappNumber,
    phone: shop.phone,
    address: shop.address,
    locationUrl: shop.locationUrl,
    status: shop.status,
    openingTime: shop.openingTime,
    closingTime: shop.closingTime,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
}
