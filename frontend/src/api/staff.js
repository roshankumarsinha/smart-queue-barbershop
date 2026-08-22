import { api } from './client';

// A shop's registered barbers — ADMIN or the shop's own owner. Java serves these
// under /shops/:shopId/staff.

export const getShopStaff = (shopId, token) =>
  api.get(`/shops/${shopId}/staff`, { token });

// body: { name, phone, pin } — phone + pin are exactly what the barber signs in with.
export const addShopStaff = (shopId, body, token) =>
  api.post(`/shops/${shopId}/staff`, { body, token });

// ADMIN only — the backend rejects this for a shop's own owner too. Frees up the
// phone number, so re-registering the same person later is just a normal new hire.
export const removeShopStaff = (shopId, staffId, token) =>
  api.delete(`/shops/${shopId}/staff/${staffId}`, { token });

// body: { pin } — no old PIN needed; ADMIN or the shop's own owner can reset it.
export const updateStaffPin = (shopId, staffId, body, token) =>
  api.patch(`/shops/${shopId}/staff/${staffId}/pin`, { body, token });
