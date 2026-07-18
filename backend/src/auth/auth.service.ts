import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LOGIN_AUTH_METHOD } from '../common/constants';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  // Validates credentials for the requested role and returns the shape the
  // frontend expects: { user, role, token }.
  async login(dto: LoginDto) {
    const method = LOGIN_AUTH_METHOD[dto.roleKey];

    const user =
      method === 'email'
        ? await this.users.findByEmailAndRole(dto.email!, dto.roleKey)
        : await this.users.findByPhoneAndRole(dto.phone!, dto.roleKey);

    // Generic message on purpose — don't leak which field was wrong.
    const invalid = new UnauthorizedException('Invalid credentials');
    if (!user) throw invalid;

    const secret = method === 'email' ? dto.password! : dto.pin!;
    const hash = method === 'email' ? user.passwordHash : user.pinHash;
    if (!hash || !(await bcrypt.compare(secret, hash))) throw invalid;

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        identifier: method === 'email' ? user.email : user.phone,
        shopId: user.shopId,
      },
      role: user.role,
      token,
    };
  }
}
