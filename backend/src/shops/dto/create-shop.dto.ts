import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ShopType } from '../../common/constants';

const SHOP_TYPES = Object.values(ShopType);

// "Register a shop under this owner" payload. The owner comes from the URL, not
// the body. `type` defaults to SALON; times are "HH:mm".
export class CreateShopDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsIn(SHOP_TYPES, { message: 'Unknown shop type' })
  type?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  locationUrl?: string;

  @IsOptional()
  @IsString()
  openingTime?: string;

  @IsOptional()
  @IsString()
  closingTime?: string;
}
