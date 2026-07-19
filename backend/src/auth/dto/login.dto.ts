import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LOGIN_AUTH_METHOD } from '../../common/constants';

const LOGIN_ROLES = Object.keys(LOGIN_AUTH_METHOD); // SHOP_OWNER, SUPER_ADMIN, BARBER_STAFF

// Matches the payload the frontend sends (src/api/auth.js):
//   { roleKey, email?, password?, phone?, pin? }
export class LoginDto {
  @IsIn(LOGIN_ROLES, { message: 'Unknown or non-login role' })
  roleKey: string;

  // Required only for email-based roles (owner / admin).
  @ValidateIf((o) => LOGIN_AUTH_METHOD[o.roleKey] === 'email')
  @IsString()
  email?: string;

  @ValidateIf((o) => LOGIN_AUTH_METHOD[o.roleKey] === 'email')
  @IsString()
  @MinLength(6)
  password?: string;

  // Required only for phone-based roles (barber).
  @ValidateIf((o) => LOGIN_AUTH_METHOD[o.roleKey] === 'phone')
  @IsString()
  phone?: string;

  @ValidateIf((o) => LOGIN_AUTH_METHOD[o.roleKey] === 'phone')
  @IsString()
  pin?: string;

  @IsOptional()
  @IsString()
  shopId?: string;
}
