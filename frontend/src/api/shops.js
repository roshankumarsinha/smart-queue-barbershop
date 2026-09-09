import { api } from './client';

// Shops API — for the Super Admin (SaaS) view. GET requires any authenticated user.
export const getShops = (token) => api.get('/shops', { token });

// One shop by id (works for NEW/CLOSED shops too, unlike the list).
export const getShop = (shopId, token) => api.get(`/shops/${shopId}`, { token });

// Every shop owned by the signed-in SHOP_OWNER — self-service, unlike
// getOwnerShops (the admin-only drill-down that needs an ownerId).
export const getMyShops = (token) => api.get('/shops/mine', { token });

// Shop open/close — ADMIN or the shop's own owner. Opening flips a NEW/CLOSED shop
// to OPEN. Closing within business hours just pauses (status only); closing outside
// hours resets the shop (fresh tokens, cleared queue, staff off duty). Both return a
// ShopStatusResponse ({ id, status }).
export const openShop = (shopId, token) => api.post(`/shops/${shopId}/open`, { token });
export const closeShop = (shopId, token) => api.post(`/shops/${shopId}/close`, { token });
