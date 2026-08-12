import { api } from './client';

// Services a shop offers — SUPER_ADMIN or the shop's owner. Java serves these under
// /shops/:shopId/services.

export const getShopServices = (shopId, token) =>
  api.get(`/shops/${shopId}/services`, { token });

// The catalog for the shop's type minus what it already offers — the add dropdown.
export const getAvailableServices = (shopId, token) =>
  api.get(`/shops/${shopId}/services/available`, { token });

// body: { service, estimatedMinutes, price? }
export const addShopService = (shopId, body, token) =>
  api.post(`/shops/${shopId}/services`, { body, token });

export const updateShopService = (shopId, serviceId, body, token) =>
  api.patch(`/shops/${shopId}/services/${serviceId}`, { body, token });

export const deleteShopService = (shopId, serviceId, token) =>
  api.delete(`/shops/${shopId}/services/${serviceId}`, { token });
