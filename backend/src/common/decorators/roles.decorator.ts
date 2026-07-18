import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants';

export const ROLES_KEY = 'roles';

// Restrict a route to one or more roles: @Roles(Role.SHOP_OWNER, Role.BARBER_STAFF)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
