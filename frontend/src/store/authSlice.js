import { createSlice } from '@reduxjs/toolkit';

// Auth / session slice.
//
// status lifecycle: 'idle' -> 'loading' -> 'authenticated' | 'error'
// The token is stored here for now; when a real backend + refresh flow exists,
// consider persisting it (e.g. Capacitor Preferences) and rehydrating on boot.
const initialState = {
  user: null, // { id, name, ... }
  role: null, // one of the keys in config/roles.js
  token: null, // auth token from the backend (mocked for now)
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    loginSuccess(state, action) {
      const { user, role, token } = action.payload;
      state.user = user;
      state.role = role;
      state.token = token;
      state.status = 'authenticated';
      state.error = null;
    },
    loginFailure(state, action) {
      state.status = 'error';
      state.error = action.payload ?? 'Login failed';
    },
    logout() {
      // Reset back to a clean initial state.
      return { ...initialState };
    },
    // Reflect a barber's own on/off-duty toggle in the session so the state
    // survives reloads (persisted to localStorage) without a round-trip to /me.
    setUserOnDuty(state, action) {
      if (state.user) state.user.onDuty = action.payload;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUserOnDuty } =
  authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectToken = (state) => state.auth.token;
export const selectShopId = (state) => state.auth.user?.shopId ?? null;
export const selectIsAuthenticated = (state) =>
  state.auth.status === 'authenticated' && !!state.auth.user;

export default authSlice.reducer;
