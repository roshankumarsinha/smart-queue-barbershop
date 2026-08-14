import { api } from './client';

// Shop-owner administration — ADMIN only (the backend enforces the role).
// Java backend serves these at the root: /owners, /owners/:id, /owners/:id/shops.

export const getOwners = (token) => api.get('/owners', { token });

export const getOwner = (id, token) => api.get(`/owners/${id}`, { token });

// body: { name, email, phone?, password }
export const createOwner = (body, token) => api.post('/owners', { body, token });

// Shops are a sub-resource of an owner (a shop is always created under one).
export const getOwnerShops = (ownerId, token) =>
  api.get(`/owners/${ownerId}/shops`, { token });

// body: { name, type?, whatsappNumber?, phone?, address?, locationUrl?, openingTime?, closingTime? }
export const createOwnerShop = (ownerId, body, token) =>
  api.post(`/owners/${ownerId}/shops`, { body, token });
