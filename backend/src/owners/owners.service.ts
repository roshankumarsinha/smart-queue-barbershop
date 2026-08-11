import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ShopsService } from '../shops/shops.service';
import { Role } from '../common/constants';
import { CreateOwnerDto } from './dto/create-owner.dto';

// Never leaks the password hash; shopCount drives the "N shops" badge.
export interface OwnerResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  shopCount: number;
}

@Injectable()
export class OwnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shops: ShopsService,
  ) {}

  // The admin types the initial password; it is hashed here so plaintext never
  // reaches persistence. Email is globally unique (owners sign in with it); a phone,
  // if given, must be unique too — both are pre-checked for a clean 409.
  async createOwner(dto: CreateOwnerDto): Promise<OwnerResponse> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim() || null;

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with this email already exists');
    }
    if (phone && (await this.prisma.user.findUnique({ where: { phone } }))) {
      throw new ConflictException('A user with this phone number already exists');
    }

    const owner = await this.prisma.user.create({
      data: {
        role: Role.SHOP_OWNER,
        name: dto.name.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        phone,
      },
    });
    return { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone, shopCount: 0 };
  }

  // All owners, oldest first, each with its current shop count.
  async findAll(): Promise<OwnerResponse[]> {
    const owners = await this.prisma.user.findMany({
      where: { role: Role.SHOP_OWNER },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(
      owners.map(async (o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        shopCount: await this.shops.countByOwner(o.id),
      })),
    );
  }

  async findById(id: string): Promise<OwnerResponse> {
    const owner = await this.prisma.user.findFirst({
      where: { id, role: Role.SHOP_OWNER },
    });
    if (!owner) throw new NotFoundException('Owner not found');
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      shopCount: await this.shops.countByOwner(owner.id),
    };
  }
}
