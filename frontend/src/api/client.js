// Thin fetch wrapper, ready for a real backend later.
//
// Usage (once a backend exists):
//   import { api } from '../api/client';
//   const queue = await api.get('/queue', { token });
//   await api.post('/queue/next', { body: { shopId }, token });
//
// Pair this with @tanstack/react-query in components:
//   useQuery({ queryKey: ['queue', shopId], queryFn: () => api.get(...) })

// TODO: point this at the real API. Vite exposes env vars prefixed with VITE_.
// Create frontend/.env.local with e.g. VITE_API_BASE_URL=https://api.smartqueue.app
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request(path, { method = 'GET', body, token, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    // TODO: shape this into a typed error the UI can branch on (401 -> logout,
    // 403 -> forbidden, etc.) once real endpoints and error contracts exist.
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      // NestJS returns validation errors as an array of strings.
      if (Array.isArray(data.message)) message = data.message.join(', ');
      else if (data.message) message = data.message;
    } catch {
      /* non-JSON error body — keep the default message */
    }
    const error = new Error(message);
    error.status = res.status; // let callers branch on 401 -> logout, etc.
    throw error;
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, opts) => request(path, { ...opts, method: 'POST' }),
  patch: (path, opts) => request(path, { ...opts, method: 'PATCH' }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export default api;
