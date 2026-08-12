import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OwnersService } from './owners.service';
import { ShopsService } from '../shops/shops.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { CreateShopDto } from '../shops/dto/create-shop.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants';

// Shop-owner onboarding. Every route here is SUPER_ADMIN-only.
@Controller('owners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class OwnersController {
  constructor(
    private readonly owners: OwnersService,
    private readonly shops: ShopsService,
  ) {}

  @Post()
  create(@Body() dto: CreateOwnerDto) {
    return this.owners.createOwner(dto);
  }

  @Get()
  findAll() {
    return this.owners.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.owners.findById(id);
  }

  // --- Shops under an owner (the admin drill-down) ---------------------------

  @Get(':id/shops')
  async shopsForOwner(@Param('id') id: string) {
    await this.owners.findById(id); // 404s if the owner does not exist
    return this.shops.findByOwner(id);
  }

  @Post(':id/shops')
  @HttpCode(201)
  async createShop(@Param('id') id: string, @Body() dto: CreateShopDto) {
    await this.owners.findById(id); // 404s if the owner does not exist
    return this.shops.create({ ownerId: id, ...dto });
  }
}
