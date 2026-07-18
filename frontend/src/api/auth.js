import { api } from './client';

// Auth API — talks to the NestJS backend.
//
// Backend contract (see backend/src/auth):
//   POST /api/auth/login  { roleKey, email?, password?, phone?, pin? }
//     -> { user, role, token }
//   Owners/admins send email+password; barbers send phone+PIN.
//
// The base URL comes from VITE_API_BASE_URL (frontend/.env.local); it defaults
// to "/api". The { user, role, token } response is dispatched straight into the
// Redux auth slice by the login screen.
export function login({ roleKey, credentials }) {
  return api.post('/auth/login', { body: { roleKey, ...credentials } });
}

// Restore the current session from a token (GET /api/auth/me).
export function fetchMe(token) {
  return api.get('/auth/me', { token });
}
