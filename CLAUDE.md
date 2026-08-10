# Smart Queue — repo guide for Claude

Read this first. It gives the whole layout, the flows, and where things live so you
don't have to open every file each session. For **what the current branch changed**,
also read [`.claude/context/RECENT_CHANGES.md`](.claude/context/RECENT_CHANGES.md)
(auto-generated on `git add` by a hook — see "Automation" below).

## What the app is
Queue management for barbershops. **Customers join the queue over WhatsApp — no
login.** Staff (owner / barber / admin) manage a live queue from a dashboard that
**polls every ~4s**. Owners open/close the shop; the system notifies waiting
customers.

## Monorepo layout
One frontend, **two interchangeable backends** speaking the same REST contract.

| Dir | Stack | Role |
| --- | --- | --- |
| [`frontend/`](frontend) | React 19 + Vite + MUI + Tailwind + Redux Toolkit + React Query + framer-motion + Capacitor | The only frontend (web + Android/iOS via Capacitor) |
| [`backend-java/`](backend-java) | Spring Boot, hexagonal, Postgres + Flyway | **PRIMARY backend** |
| [`backend/`](backend) | NestJS + Prisma + SQLite | **SECONDARY backend** (kept in sync, used as fallback/reference) |

> **The one difference that matters:** the **Java** backend serves routes at the
> **root** (`/auth/login`); the **NestJS** backend serves them under **`/api`**
> (`/api/auth/login`). Everything else (paths, JWT payload, roles, demo logins) is
> identical. The frontend picks the backend via `VITE_API_BASE_URL`
> (`frontend/.env.local`). See [`RUNNING.md`](RUNNING.md) for the full run/switch guide.

## Roles & auth
Defined once per layer — keep them in sync:
- Frontend: [`frontend/src/config/roles.js`](frontend/src/config/roles.js)
- Java: [`backend-java/.../domain/Role.java`](backend-java/src/main/java/com/smartqueue/domain/Role.java)

| Role | Signs in with | Dashboard |
| --- | --- | --- |
| `SHOP_OWNER` | email + password | `/owner` |
| `BARBER_STAFF` | phone + 4-digit PIN | `/staff` |
| `SUPER_ADMIN` | email + password | `/admin` |
| `CUSTOMER` | never logs in (WhatsApp only) | — |

Demo logins (seeded, both backends): owner `owner@shop.com` / `secret123`;
barber phone `9876543210` / PIN `1234`; admin `admin@smartqueue.app` / `admin123`.
Demo shop id: `demo-shop`.

**Auth is stateless JWT** (HS256, `sub`=user id + `role` claim, 7-day expiry), bcrypt
password/PIN hashes. Login → `{ user, role, token }`. The token is attached as
`Authorization: Bearer <jwt>` on every later request and re-validated (user re-read
from DB) per request. **Logout is client-only** — it clears the token; the JWT stays
valid server-side until expiry (no revocation list).

## Data model (both backends)
`Shop`, `User`, `QueueEntry`, `Notification`.
- Java schema: [`backend-java/.../db/migration/V1__init.sql`](backend-java/src/main/resources/db/migration/V1__init.sql) (Flyway owns it; Hibernate only validates).
- NestJS schema: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

## Frontend
- Entry/routing: [`frontend/src/App.jsx`](frontend/src/App.jsx) (routes + sticky-footer layout). Screens in `src/screens`, shared UI in `src/components`.
- API layer: [`src/api/client.js`](frontend/src/api/client.js) (fetch wrapper, base URL from `VITE_API_BASE_URL`) + `src/api/*.js`.
- State: Redux Toolkit `src/store` (`authSlice` holds the session; persisted to `localStorage` via `authStorage.js`). Server state via React Query.
- **Design language (keep consistent):** vintage barbershop — colors charcoal `#1B1512`, ivory `#F3ECDF`, brass `#C89B3C`, oxblood `#7B2D2D` (tokens in [`tailwind.config.js`](frontend/tailwind.config.js) + [`src/theme.js`](frontend/src/theme.js)). Display font **Bebas Neue** (`font-display`), labels **Oswald** (`font-signage`), body = system sans. Heavy framer-motion use (hover lifts, count-ups, brass "gleam" CTAs). Mobile-first (Capacitor); verify at 375px too.
- Lint: `npm run lint` (oxlint). **Editing `tailwind.config.js`/`index.html` needs a dev-server restart** (HMR serves stale CSS/fonts otherwise).

## Backend — Java (PRIMARY)
Hexagonal / ports-and-adapters under `backend-java/src/main/java/com/smartqueue`:
- `domain/` — pure model (`Role`, `AuthMethod`, `model/User`, exceptions).
- `application/` — `port/in` (use cases + `command`/`result`), `port/out` (repos, hashers, token issuer), `service/` (impls, e.g. `AuthService`, `QueueService`).
- `adapter/in/web/` — controllers + DTOs + `security/JwtAuthenticationFilter`.
- `adapter/out/` — `persistence/` (JPA), `security/` (JWT, bcrypt), `notification/` (WhatsApp Cloud API).
- `config/` — `SecurityConfig` (stateless, per-route rules, CORS from `CORS_ORIGINS`), `SmartQueueProperties`.
- Config: [`application.yml`](backend-java/src/main/resources/application.yml). Key envs: `PORT`, `JWT_SECRET`, `CORS_ORIGINS`, `DATABASE_URL`, `WHATSAPP_TOKEN`.

## Backend — NestJS (SECONDARY)
Modules under `backend/src`: `auth` (JWT strategy + guards), `queue`, `shops`, `users`,
`notifications`, `prisma`, `common` (decorators/guards). Routes under `/api`. SQLite via
Prisma. Realtime via Socket.io (Java uses STOMP — not wire-compatible, but the dashboard
polls so neither is required).

## Running (quick ref — full details in RUNNING.md)
```bash
# Frontend
cd frontend && npm install && npm run dev          # http://localhost:5173
npm run dev:lan                                     # same, exposed on the LAN IP (phone testing)

# Java backend (PRIMARY)
cd backend-java && docker compose up -d             # Postgres
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home   # JDK 25
./mvnw spring-boot:run                              # http://localhost:3000  (root, no /api)

# NestJS backend (SECONDARY)
cd backend && npm install && npm run prisma:migrate && npm run db:seed && npm run start:dev  # http://localhost:3000/api
```
Point the frontend at the chosen backend in `frontend/.env.local`:
`VITE_API_BASE_URL=http://localhost:3000` (Java) or `.../api` (NestJS). Vite reads env
only at startup — restart after changing it. For a phone, use the backend machine's LAN
IP, not `localhost`.

## Conventions
- Match surrounding code style; don't introduce new libraries without reason.
- Keep the **Java and NestJS backends in sync** when changing the API contract, roles, or data model. Java is primary — implement there first.
- Preserve the frontend design language (above).
- Run `npm run lint` in `frontend/` before finishing frontend work.

## Automation
A `PostToolUse` hook ([`.claude/hooks/update-changes.sh`](.claude/hooks/update-changes.sh),
wired in [`.claude/settings.json`](.claude/settings.json)) regenerates
[`.claude/context/RECENT_CHANGES.md`](.claude/context/RECENT_CHANGES.md) whenever you run
`git add`. That file summarizes the current branch (commits + diffstat vs `master`) so the
next session — and reviewers — can see what changed before a PR without re-reading files.
