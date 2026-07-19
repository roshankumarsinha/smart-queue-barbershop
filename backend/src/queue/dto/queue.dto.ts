import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ServiceType } from '../../common/constants';

const SERVICES = Object.values(ServiceType);

export class JoinQueueDto {
  @IsString()
  shopId: string;

  @IsIn(SERVICES, { message: 'Unknown service' })
  service: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}

export class ShopIdDto {
  @IsString()
  shopId: string;
}

export class EntryIdDto {
  @IsString()
  entryId: string;
}

export class NotifyDto {
  @IsString()
  entryId: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  message?: string;
}
