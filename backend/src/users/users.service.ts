import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // Owners / admins log in by email; scoped to the requested role so an owner
  // can't sign in through the admin tab and vice-versa.
  findByEmailAndRole(email: string, role: string) {
    return this.prisma.user.findFirst({ where: { email, role } });
  }

  // Barbers log in by phone.
  findByPhoneAndRole(phone: string, role: string) {
    return this.prisma.user.findFirst({ where: { phone, role } });
  }
}
