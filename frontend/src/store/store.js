import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { loadAuthState, saveAuthState } from './authStorage';

// Rehydrate the auth session from localStorage on boot so reloads stay logged in.
const preloadedAuth = loadAuthState();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // TODO: add feature slices here as the app grows (e.g. queue, shops).
  },
  preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
});

// Persist the auth slice whenever it changes (login writes it, logout clears it).
let lastAuth = store.getState().auth;
store.subscribe(() => {
  const auth = store.getState().auth;
  if (auth !== lastAuth) {
    lastAuth = auth;
    saveAuthState(auth);
  }
});

export default store;
