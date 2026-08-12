import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants';

// Shop lifecycle (list / fetch / open / close). Registering a shop lives on the
// owner sub-resource (POST /owners/:id/shops) — see OwnersController.
@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  // Any authenticated staff/admin can list shops. Only OPEN shops are listed.
  @Get()
  findAll() {
    return this.shops.findAll();
  }

  // Works for NEW/CLOSED shops too, unlike the list.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shops.findOne(id);
  }

  // Closing/reopening: SUPER_ADMIN, or the shop's own owner (checked in the service).
  @Post(':id/close')
  @Roles(Role.SUPER_ADMIN, Role.SHOP_OWNER)
  close(@Param('id') id: string, @CurrentUser() caller: AuthUser) {
    return this.shops.close(id, caller);
  }

  @Post(':id/open')
  @Roles(Role.SUPER_ADMIN, Role.SHOP_OWNER)
  open(@Param('id') id: string, @CurrentUser() caller: AuthUser) {
    return this.shops.open(id, caller);
  }
}
