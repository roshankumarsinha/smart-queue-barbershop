import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  // Any authenticated staff/admin can list shops.
  @Get()
  findAll() {
    return this.shops.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shops.findOne(id);
  }

  // Only the SaaS super-admin creates shops.
  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateShopDto) {
    return this.shops.create(dto);
  }
}
