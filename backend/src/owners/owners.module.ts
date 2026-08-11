import { Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { ShopsModule } from '../shops/shops.module';

@Module({
  imports: [ShopsModule], // for ShopsService (shop create/list under an owner)
  controllers: [OwnersController],
  providers: [OwnersService],
})
export class OwnersModule {}
