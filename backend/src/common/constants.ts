// Shared enums / constants — the source of truth for the string values stored
// in the database (see prisma/schema.prisma) and mirrored by the frontend's
// src/config/roles.js.

export const Role = {
  SHOP_OWNER: 'SHOP_OWNER',
  BARBER_STAFF: 'BARBER_STAFF',
  SUPER_ADMIN: 'SUPER_ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// Which login roles authenticate with which credential set.
export const LOGIN_AUTH_METHOD: Record<string, 'email' | 'phone'> = {
  SHOP_OWNER: 'email',
  SUPER_ADMIN: 'email',
  BARBER_STAFF: 'phone',
};

export const QueueStatus = {
  WAITING: 'WAITING',
  IN_SERVICE: 'IN_SERVICE',
  DONE: 'DONE',
  SKIPPED: 'SKIPPED',
  NO_SHOW: 'NO_SHOW',
  LEFT: 'LEFT',
} as const;
export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

// Whether a shop is currently taking customers. A CLOSED shop is hidden from
// GET /shops and rejects new queue joins, but stays reachable by id so staff can
// manage or reopen it.
export const ShopStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;
export type ShopStatus = (typeof ShopStatus)[keyof typeof ShopStatus];

export const ServiceType = {
  HAIRCUT: 'HAIRCUT',
  BEARD: 'BEARD',
  HAIRCUT_BEARD: 'HAIRCUT_BEARD',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

// Roles allowed to operate the live queue dashboard.
export const STAFF_ROLES: Role[] = [Role.SHOP_OWNER, Role.BARBER_STAFF];
