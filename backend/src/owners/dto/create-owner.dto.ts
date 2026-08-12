import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Admin-facing "register a shop owner" payload. Owners sign in with email +
// password; phone is optional contact info.
export class CreateOwnerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email' })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
