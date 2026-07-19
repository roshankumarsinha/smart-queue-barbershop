// Persists the auth session to localStorage so a page reload / app restart
// keeps the user logged in. Works in both the web app and the Capacitor
// Android WebView.
//
// NOTE: localStorage is fine for now. For a hardened native build, consider
// Capacitor Preferences (or secure storage) for the token instead.

const KEY = 'smartqueue.auth';

// Returns a partial auth state suitable for `preloadedState`, or undefined.
export function loadAuthState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) return undefined;
    return {
      user: parsed.user,
      role: parsed.role,
      token: parsed.token,
      status: 'authenticated',
      error: null,
    };
  } catch {
    return undefined;
  }
}

// Persists on login, clears on logout / unauthenticated states.
export function saveAuthState(auth) {
  try {
    if (auth?.status === 'authenticated' && auth.token) {
      localStorage.setItem(
        KEY,
        JSON.stringify({ user: auth.user, role: auth.role, token: auth.token }),
      );
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    /* private mode / quota — ignore, session just won't persist */
  }
}
