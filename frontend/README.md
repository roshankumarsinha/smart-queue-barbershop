# Smart Queue — Staff App (`smart-queue-app`)

The **staff-facing** side of Smart Queue: shop owners and barbers manage the live
queue (Next Customer / Add Walk-in / Skip / No-show) from their phone. Customers
themselves interact only over WhatsApp (a separate system) — there is no customer
login here.

Built as a React (Vite) web app and wrapped with **Capacitor** for Android /
Google Play.

## Stack

| Concern     | Choice                                             |
| ----------- | -------------------------------------------------- |
| UI          | React 19 + Vite (JSX)                              |
| Native wrap | Capacitor (Android)                                |
| Routing     | react-router-dom                                   |
| State       | Redux Toolkit + react-redux (auth/session)         |
| Data        | @tanstack/react-query (ready for a real backend)   |
| Styling     | Tailwind CSS (custom barbershop theme)             |
| Animation   | Framer Motion                                      |
| Icons       | lucide-react                                       |

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

## Project layout

```
src/
  api/          client.js (fetch wrapper), auth.js (MOCK login — swap for real API)
  components/   BarberLoginScreen, ProtectedRoute, DashboardShell, BarberPole, ...
  config/       roles.js — RBAC source of truth (routes, auth method, permissions)
  lib/          motion.js — shared Framer Motion variants
  screens/      LoginScreen, OwnerDashboard, StaffDashboard, AdminDashboard
  store/        store.js (configureStore), authSlice.js
  App.jsx       Provider + Router + AnimatePresence
```

## Roles (RBAC)

- `SHOP_OWNER` — full dashboard, manage staff, reports, open/close shop
- `BARBER_STAFF` — restricted: Next Customer / Add Walk-in / Skip
- `ADMIN` — manages all shops on the platform (SaaS side)
- `CUSTOMER` — reserved in the schema; no login screen (WhatsApp-only for now)

## Android (Capacitor)

```bash
npm run build        # -> dist/
npx cap sync         # copy dist/ into the android project + update plugins
npm run cap:android  # open the project in Android Studio (needs Android Studio)
# or the combined convenience script:
npm run cap:sync     # build + cap sync
```

App identity: **Smart Queue** / `com.smartqueue.app` (see `capacitor.config.json`).

## Backend seams

There is **no backend yet** — the login is mocked. Search the source for `TODO`
to find every place a mock needs to be swapped for a real API call:

- `src/api/auth.js` — `mockLogin` (setTimeout, fake token) → real `POST /auth/login`
- `src/api/client.js` — set `VITE_API_BASE_URL`, flesh out error handling
- `src/screens/OwnerDashboard.jsx` / `AdminDashboard.jsx` — hardcoded stats → react-query
- `src/store/authSlice.js` — persist the token (e.g. Capacitor Preferences) so a
  reload / app restart keeps the session
