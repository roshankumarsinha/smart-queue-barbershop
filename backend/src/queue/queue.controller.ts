import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import {
  JoinQueueDto,
  ShopIdDto,
  EntryIdDto,
  NotifyDto,
} from './dto/queue.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants';

@Controller('queue')
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  // --- Public (customer / WhatsApp side) ------------------------------------

  // Customer checks their own status — place in line and updated wait estimate.
  // The entryId returned by /queue/join is the only credential needed.
  @Get('status/:entryId')
  entryStatus(@Param('entryId') entryId: string) {
    return this.queue.entryStatus(entryId);
  }

  // Customer joins the queue (in production this is triggered by the WhatsApp
  // webhook; exposed here for the app + testing).
  @Post('join')
  @HttpCode(201)
  join(@Body() dto: JoinQueueDto) {
    return this.queue.join(dto);
  }

  // Customer leaves the queue.
  @Post('leave')
  @HttpCode(200)
  leave(@Body() dto: EntryIdDto) {
    return this.queue.leave(dto.entryId);
  }

  // --- Staff-only (dashboard) -----------------------------------------------

  // The full live queue for a shop — everyone waiting, not just one entry. Same
  // payload as the WebSocket broadcast, so polling and subscribing agree.
  @Get('board')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
  board(@Query('shopId') shopId: string) {
    return this.queue.getStatus(shopId);
  }

  @Post('walkin')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
  walkin(@Body() dto: JoinQueueDto) {
    return this.queue.join(dto);
  }

  @Post('next')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
  next(@Body() dto: ShopIdDto) {
    return this.queue.next(dto.shopId);
  }

  @Post('skip')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
  skip(@Body() dto: EntryIdDto) {
    return this.queue.skip(dto.entryId);
  }

  @Post('no-show')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
  noShow(@Body() dto: EntryIdDto) {
    return this.queue.markNoShow(dto.entryId);
  }

  @Post('notify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
  notify(@Body() dto: NotifyDto) {
    return this.queue.sendNotification(dto.entryId, dto.type, dto.message);
  }
}
