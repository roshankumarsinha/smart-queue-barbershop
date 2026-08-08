import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  avgServiceTime?: number;
}
