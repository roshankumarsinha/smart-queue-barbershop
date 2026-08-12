import { api } from './client';

// Shops API — for the Super Admin (SaaS) view. GET requires any authenticated user.
export const getShops = (token) => api.get('/shops', { token });

// One shop by id (works for NEW/CLOSED shops too, unlike the list).
export const getShop = (shopId, token) => api.get(`/shops/${shopId}`, { token });
