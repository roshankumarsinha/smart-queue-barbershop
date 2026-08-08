# Running the Frontend with Either Backend

Smart Queue has **one frontend** ([`frontend/`](frontend)) and **two interchangeable backends**
that speak the same REST contract:

| Backend | Folder | Stack | Base URL (local) |
| --- | --- | --- | --- |
| NestJS | [`backend/`](backend) | Node + Prisma + SQLite | `http://localhost:3000/api` |
| Java | [`backend-java/`](backend-java) | Spring Boot + Postgres | `http://localhost:3000` |

The staff dashboard talks to the backend over plain REST and **polls** for updates (every
4 s), so no WebSocket wiring is needed for it to work against either backend. You pick which
backend the frontend uses with a single environment variable — `VITE_API_BASE_URL`.

> **The one difference that matters:** the NestJS backend serves every route under an `/api`
> prefix; the Java backend serves them at the root. So the base URL is
> `http://localhost:3000/api` for NestJS and `http://localhost:3000` for Java. Everything else
> (paths, JWT payload, roles, demo logins) is identical.

---

## Prerequisites

- **Node.js 18+** and npm (for the frontend, and for the NestJS backend)
- For the **Java** backend only: **Docker** (runs Postgres) and a **JDK 25**

---

## Step 1 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at **http://localhost:5173**. Leave it running; you'll point it at a
backend in Step 3. (Both backends already allow `http://localhost:5173` via CORS.)

---

## Step 2 — Start ONE backend

Both backends default to **port 3000**, so run only one at a time (or change one's `PORT`).
Pick the option you want.

### Option A — NestJS backend (zero setup, SQLite)

```bash
cd backend
npm install
cp .env.example .env          # defaults work as-is (SQLite file, no DB server)
npm run prisma:migrate        # creates prisma/dev.db + runs migrations
npm run db:seed               # inserts the demo shop + logins (if not already seeded)
npm run start:dev             # -> http://localhost:3000/api
```

Wait for `Smart Queue API ready on http://localhost:3000/api`.

### Option B — Java backend (Spring Boot + Postgres)

```bash
# 1. Point mvnw at your JDK 25 (macOS + Homebrew example):
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home

# 2. Start Postgres (Docker):
cd backend-java
docker compose up -d          # postgres:17-alpine on localhost:5432

# 3. Start the API (Flyway migrates + seeds demo data on first boot):
./mvnw spring-boot:run        # -> http://localhost:3000
```

Wait for `Started SmartQueueApplication`. Full details and troubleshooting live in
[`backend-java/README.md`](backend-java/README.md).

---

## Step 3 — Point the frontend at your chosen backend

The frontend reads `VITE_API_BASE_URL` from **`frontend/.env.local`**. Set it to match the
backend you started:

**If you started the NestJS backend (Option A):**

```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:3000/api
```

**If you started the Java backend (Option B):**

```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:3000
```

> ⚠️ **Vite only reads env files at startup.** After editing `.env.local`, stop `npm run dev`
> (Ctrl-C) and start it again — a hot reload will not pick up the change.

---

## Step 4 — Log in and verify

Open **http://localhost:5173** and sign in with any seeded account (identical on both backends):

| Role | Login |
| --- | --- |
| Shop owner | `owner@shop.com` / `secret123` |
| Barber | phone `9876543210` / PIN `1234` |
| Super admin | `admin@smartqueue.app` / `admin123` |

Demo shop id: `demo-shop`. Once logged in, the dashboard polls the live queue and the staff
actions (Next Customer / Add Walk-in / Skip / No-show) work against whichever backend is
running.

Quick backend smoke test from the terminal (adjust the base URL for your backend):

```bash
# NestJS:
curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"roleKey":"SUPER_ADMIN","email":"admin@smartqueue.app","password":"admin123"}'

# Java:
curl -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"roleKey":"SUPER_ADMIN","email":"admin@smartqueue.app","password":"admin123"}'
```

Both return `{ user, role, token }`.

---

## Switching between backends

1. Stop the running backend:
   - NestJS: Ctrl-C in its terminal.
   - Java: `pkill -f spring-boot:run` (Postgres can stay up, or `docker compose down`).
2. Start the other backend (Step 2).
3. Update `frontend/.env.local` to the matching base URL (Step 3) — **remember the `/api`
   difference**.
4. Restart `npm run dev`.

---

## Notes & gotchas

- **Port clash:** both backends default to 3000. To run them side by side, start one with a
  different port — NestJS `PORT=3001 npm run start:dev`, Java `PORT=3001 ./mvnw spring-boot:run`
  — and set `VITE_API_BASE_URL` accordingly.
- **Realtime transport differs** and is **not** wire-compatible between the two: NestJS uses
  Socket.io, the Java backend uses STOMP-over-WebSocket. The staff dashboard doesn't depend on
  either (it polls), so both work out of the box; only a custom live-socket integration would
  need to match the backend.
- **Packaged/mobile builds** use `frontend/.env.production` instead of `.env.local`, and a
  phone can't reach `localhost` — see the comments in that file.
