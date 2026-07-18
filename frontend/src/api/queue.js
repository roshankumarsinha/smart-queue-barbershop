import { api } from './client';

// Queue API — maps to backend/src/queue (see backend/README.md).

export const getQueueStatus = (shopId, token) =>
  api.get(`/queue/status?shopId=${encodeURIComponent(shopId)}`, { token });

// Staff actions (require a Bearer token with SHOP_OWNER / BARBER_STAFF).
export const advanceQueue = (shopId, token) =>
  api.post('/queue/next', { body: { shopId }, token });

export const addWalkin = ({ shopId, service, name, phone }, token) =>
  api.post('/queue/walkin', { body: { shopId, service, name, phone }, token });

export const skipEntry = (entryId, token) =>
  api.post('/queue/skip', { body: { entryId }, token });

export const noShowEntry = (entryId, token) =>
  api.post('/queue/no-show', { body: { entryId }, token });
