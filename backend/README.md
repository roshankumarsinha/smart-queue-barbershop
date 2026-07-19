# Smart Queue — Backend API (NestJS)

The API behind Smart Queue: staff authentication (RBAC), live queue management,
realtime updates, and a WhatsApp notification seam. **100% free stack** — no paid
services required to run or develop.

## Stack (all free / open source)

| Concern    | Choice                                                         |
| ---------- | -------------------------------------------------------------- |
| Framework  | NestJS 11 (TypeScript)                                         |
| Database   | **SQLite** via Prisma (file-based, zero setup, no account)     |
| ORM        | Prisma 6                                                       |
| Auth       | JWT (`@nestjs/jwt` + Passport), `bcryptjs` password/PIN hashes |
| Validation | class-validator / class-transformer                            |
| Realtime   | Socket.io (`@nestjs/websockets`)                               |
| Messaging  | WhatsApp Cloud API **seam** (runs as a free local stub)        |

> The database is SQLite so it costs nothing and needs no server. The schema is
> written to be portable — to move to a **free** hosted Postgres (Neon/Supabase)
> later, change `provider` in `prisma/schema.prisma` to `postgresql`, set
> `DATABASE_URL`, and run `npm run prisma:migrate`.

## Setup

```bash
cd backend
npm install
cp .env.example .env          # defaults work as-is (SQLite)
npm run prisma:migrate        # creates prisma/dev.db + runs the seed
npm run start:dev             # http://localhost:3000/api
```

If migrations already exist, just seed with `npm run db:seed`.

### Seeded demo accounts

| Role         | Login                               |
| ------------ | ----------------------------------- |
| SHOP_OWNER   | `owner@shop.com` / `secret123`      |
| BARBER_STAFF | phone `9876543210` / PIN `1234`     |
| SUPER_ADMIN  | `admin@smartqueue.app` / `admin123` |

Demo shop id: `demo-shop`.

## API

Base path: `/api`. Body is JSON.

### Auth

- `POST /auth/login` — `{ roleKey, email?, password?, phone?, pin? }` → `{ user, role, token }`
  (owners/admins use email+password; barbers use phone+PIN). Matches the frontend contract.
- `GET /auth/me` — current user (Bearer token).

### Queue

- `GET  /queue/status?shopId=` — live state: serving, waiting list, totals, ETA (public)
- `POST /queue/join` — `{ shopId, service, phone?, name? }` (public; normally the WhatsApp webhook)
- `POST /queue/leave` — `{ entryId }` (public)
- `POST /queue/walkin` — `{ shopId, service, phone?, name? }` **(staff)**
- `POST /queue/next` — `{ shopId }` — finish current, promote next **(staff)**
- `POST /queue/skip` — `{ entryId }` — move to end of queue **(staff)**
- `POST /queue/no-show` — `{ entryId }` **(staff)**
- `POST /queue/notify` — `{ entryId, type, message? }` **(staff)**

**(staff)** = requires a Bearer JWT with role `SHOP_OWNER` or `BARBER_STAFF`.
`services`: `HAIRCUT` | `BEARD` | `HAIRCUT_BEARD`.

### Shops (SaaS/admin)

- `GET /shops`, `GET /shops/:id` (any authenticated user)
- `POST /shops` (SUPER_ADMIN only)

### Realtime (Socket.io)

Connect to the server, then:

```js
socket.emit("queue:subscribe", { shopId });
socket.on("queue:update", (state) => {
  /* fresh queue state on every change */
});
```

## Frontend integration

The frontend is **already wired** to this API (`frontend/src/api/*`): login, the
live queue board, and staff actions (next / walk-in / skip / no-show) all call
these endpoints, and CORS in `main.ts` allows the Vite dev origin plus the
Capacitor app origins. The dev base URL is `frontend/.env.local`
(`VITE_API_BASE_URL=http://localhost:3000/api`).

> **Mobile app note:** the packaged Android/iOS app cannot reach `localhost`
> (on a phone that's the phone itself). For store builds this API must be
> **deployed to a public HTTPS URL**, set in `frontend/.env.production`. Free
> hosting tiers that work: Render / Railway / Fly.io for the API, plus
> Neon / Supabase for Postgres.

## Structure

```
prisma/            schema.prisma, migrations/, seed.ts
src/
  common/          constants (roles/statuses/services), guards, decorators
  prisma/          PrismaService (global)
  auth/            JWT login, strategy, guards, DTO
  users/           user lookups
  shops/           shop CRUD (admin)
  queue/           queue service + controller + Socket.io gateway + DTOs
  notifications/   WhatsApp stub (free) with the real Cloud API seam
  main.ts          bootstrap (global /api prefix, CORS, validation)
```

## Notes / seams for later (grep `TODO`)

- `src/notifications/notifications.service.ts` — implement the real Meta WhatsApp
  Cloud API call (free tier). Runs as a logging stub until `WHATSAPP_TOKEN` +
  `WHATSAPP_PHONE_NUMBER_ID` are set in `.env`.
- Add a WhatsApp **webhook** controller to translate inbound messages into
  `queue.join` / `queue.leave` calls.
