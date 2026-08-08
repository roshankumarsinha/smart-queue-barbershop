import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  // Any authenticated staff/admin can list shops. Closed shops are omitted.
  @Get()
  findAll() {
    return this.shops.findAll();
  }

  // Works for closed shops too, unlike the list.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shops.findOne(id);
  }

  // Onboarding is SUPER_ADMIN-only.
  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateShopDto) {
    return this.shops.create(dto);
  }

  // Closing/reopening also allows the shop's own owner.
  @Post(':id/close')
  @Roles(Role.SUPER_ADMIN, Role.SHOP_OWNER)
  close(@Param('id') id: string, @CurrentUser() caller: AuthUser) {
    requireCanManage(id, caller);
    return this.shops.close(id);
  }

  @Post(':id/open')
  @Roles(Role.SUPER_ADMIN, Role.SHOP_OWNER)
  open(@Param('id') id: string, @CurrentUser() caller: AuthUser) {
    requireCanManage(id, caller);
    return this.shops.open(id);
  }
}

// The role guard only proves the caller is *a* SHOP_OWNER, not the owner of *this*
// shop — a SHOP_OWNER whose token carries a different shopId must be rejected here.
function requireCanManage(shopId: string, caller: AuthUser): void {
  if (caller.role !== Role.SUPER_ADMIN && caller.shopId !== shopId) {
    throw new ForbiddenException("Not this shop's owner");
  }
}
