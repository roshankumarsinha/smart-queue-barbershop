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

// A shop's lifecycle state. Only OPEN takes customers; NEW (just registered) and
// CLOSED are hidden from GET /shops and reject new queue joins, but stay reachable
// by id so staff can open or reopen them. A freshly registered shop starts NEW.
export const ShopStatus = {
  NEW: 'NEW',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;
export type ShopStatus = (typeof ShopStatus)[keyof typeof ShopStatus];

// The kind of venue a shop is — Smart Queue is no longer barbershop-only. Mirrors
// com.smartqueue.domain.ShopType and the frontend's src/config/shopTypes.js.
export const ShopType = {
  SALON: 'SALON',
  RESTAURANT: 'RESTAURANT',
  HOSPITAL: 'HOSPITAL',
  CLINIC: 'CLINIC',
  GOVERNMENT: 'GOVERNMENT',
  RETAIL: 'RETAIL',
  OTHER: 'OTHER',
} as const;
export type ShopType = (typeof ShopType)[keyof typeof ShopType];
export const DEFAULT_SHOP_TYPE: ShopType = ShopType.SALON;

// Fallback per-customer service time (minutes) for wait estimates until per-service
// times exist (planned "register service" flow). Mirrors Shop.DEFAULT_SERVICE_MINUTES.
export const DEFAULT_SERVICE_MINUTES = 20;

export const ServiceType = {
  HAIRCUT: 'HAIRCUT',
  BEARD: 'BEARD',
  HAIRCUT_BEARD: 'HAIRCUT_BEARD',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

// Roles allowed to operate the live queue dashboard.
export const STAFF_ROLES: Role[] = [Role.SHOP_OWNER, Role.BARBER_STAFF];
