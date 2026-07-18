// Central RBAC definition for Smart Queue (staff-facing app).
//
// Every role's dashboard route, login auth method, and permission list live
// here so the router, ProtectedRoute, login screen, and dashboards all read
// from one source of truth. This is the "seam" for role-based access — when a
// real backend arrives, permissions can be driven by the API response instead
// of this static map without touching the UI.

export const ROLES = {
  SHOP_OWNER: {
    key: 'SHOP_OWNER',
    tabLabel: 'Owner',
    title: 'Shop Owner',
    path: '/owner',
    // Owners & admins authenticate with email + password.
    authMethod: 'email',
    permissions: [
      'View the live queue dashboard',
      'Add a walk-in customer',
      'Advance to the next customer',
      'Skip / mark no-show',
      'Manage barber staff',
      'View reports & analytics',
      'Open / close the shop',
    ],
  },
  BARBER_STAFF: {
    key: 'BARBER_STAFF',
    tabLabel: 'Staff',
    title: 'Barber',
    path: '/staff',
    // Barbers authenticate with phone + PIN (fast, on the shop floor).
    authMethod: 'phone',
    permissions: [
      'Advance to the next customer',
      'Add a walk-in customer',
      'Skip the current customer',
    ],
  },
  SUPER_ADMIN: {
    key: 'SUPER_ADMIN',
    tabLabel: 'Admin',
    title: 'Super Admin',
    path: '/admin',
    authMethod: 'email',
    permissions: [
      'Manage all shop accounts',
      'Create / suspend shops',
      'Assign shop owners',
      'Platform-wide reports',
      'Billing & subscriptions',
    ],
  },

  // CUSTOMER is reserved in the schema for a future in-app flow. Customers
  // currently interact only via WhatsApp, so there is intentionally no login
  // tab or dashboard for this role yet — the seam exists, the screen does not.
  // CUSTOMER: { key: 'CUSTOMER', ... }
};

// Order the login tabs appear in.
export const LOGIN_ROLE_ORDER = ['SHOP_OWNER', 'BARBER_STAFF', 'SUPER_ADMIN'];

// Map a dashboard path back to its role (used by ProtectedRoute).
export const ROLE_BY_PATH = Object.fromEntries(
  Object.values(ROLES).map((r) => [r.path, r.key]),
);

export function getRole(roleKey) {
  return ROLES[roleKey] ?? null;
}
