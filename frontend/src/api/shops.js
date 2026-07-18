import { api } from './client';

// Shops API — for the Super Admin (SaaS) view. GET requires any authenticated user.
export const getShops = (token) => api.get('/shops', { token });
