# Smart Queue — Java backend

A port of [`backend/`](../backend) (NestJS + Prisma + SQLite) to **Java 25 / Spring Boot 4**,
structured as a **hexagonal architecture** (ports & adapters) on **Postgres + Flyway**.

Same REST contract, same JWT payload, same roles — so the existing frontend can point
at either backend by changing `VITE_API_BASE_URL`. The one incompatible piece is realtime
(see [Differences](#differences-from-the-nestjs-backend)).

This file is the API reference (routes, running it, config). For the codebase layout,
the NestJS→Java mapping, what's been built, and how to enable the WhatsApp bot, see
**[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Run it

You need **Docker** (for Postgres) and a **JDK 25**. Maven does not need to be installed —
`./mvnw` downloads it on first use.

### 1. Set JAVA_HOME

`./mvnw` fails with `Unable to locate a Java Runtime` without it. On macOS + Homebrew:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home
```

Add that line to `~/.zshrc` to make it permanent. Verify with `java -version` → `25.x`.

### 2. Start Postgres

```bash
cd backend-java
docker compose up -d          # postgres:17-alpine on localhost:5432
```

### 3. Start the API

```bash
./mvnw spring-boot:run        # http://localhost:3000
```

Wait for `Started SmartQueueApplication`. On first boot Flyway creates the schema and the
seeder inserts a demo shop plus three logins:

| Role | `roleKey` | Credentials |
| --- | --- | --- |
| Shop owner | `SHOP_OWNER` | `owner@shop.com` / `secret123` |
| Barber | `BARBER_STAFF` | `9876543210` / `1234` |
| Super admin | `SUPER_ADMIN` | `admin@smartqueue.app` / `admin123` |

Set `SEED_DEMO_DATA=false` anywhere that isn't a sandbox.

### 4. Check it works

```bash
curl -s -X POST http://localhost:3000/queue/join \
  -H 'Content-Type: application/json' \
  -d '{"shopId":"demo-shop","service":"HAIRCUT","name":"Test"}'
# -> { "entry": { "id": "...", ... }, "ahead": 3, "estimatedWaitMinutes": 60 }

curl "http://localhost:3000/queue/status/<entry id from above>"
```

Then open **<http://localhost:3000/swagger-ui.html>**. To call a protected route there:
run `POST /auth/login`, copy the `token`, click **Authorize** (top right), paste it.

### 5. (Optional) Enable the WhatsApp bot

Without this the app still runs fine — outbound WhatsApp messages just log as
`[stub] WhatsApp -> ...` instead of sending. To make them real and let a customer
message the bot for real, see **[ARCHITECTURE.md § Enabling the WhatsApp bot for
real](ARCHITECTURE.md#enabling-the-whatsapp-bot-for-real)** for the full one-time
Meta setup (credentials, webhook registration, the WABA-subscription step that's easy
to miss). The short version, once that's done once:

```bash
cd backend-java
set -a; source .env; set +a
./mvnw spring-boot:run &                      # the API

cloudflared tunnel --url http://localhost:3000   # prints a fresh https://*.trycloudflare.com URL
```

Every time you restart `cloudflared`, its URL changes — re-paste the new one into
Meta App Dashboard → WhatsApp → Configuration → Webhook → Callback URL, using the
same `WHATSAPP_VERIFY_TOKEN` from `.env`. Verify it's live before messaging the bot:

```bash
curl "https://<your-tunnel>/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=<your WHATSAPP_VERIFY_TOKEN>&hub.challenge=test123"
# -> should echo back "test123"
```

Then message the WhatsApp Business number with **Hi** from a number added as a test
recipient (App Dashboard → WhatsApp → API Setup).

### Stopping and resetting

```bash
pkill -f spring-boot:run          # stop the API
pkill -f "cloudflared tunnel"     # stop the tunnel, if you started one
docker compose down               # stop Postgres, keep the data
docker compose down -v            # stop Postgres and wipe the volume
```

After `down -v` the next boot re-runs Flyway and re-seeds from scratch.

### If something fails

| Symptom | Cause |
| --- | --- |
| `Unable to locate a Java Runtime` | `JAVA_HOME` not set — step 1 |
| `Connection to localhost:5432 refused` | Postgres not up — `docker compose ps` |
| `Web server failed to start. Port 3000 was already in use` | an older run is alive — `pkill -f spring-boot:run` |
| `Schema-validation: missing table` | volume has an older schema — `docker compose down -v` |

---

## API

Interactive docs are generated from the controllers and DTOs — once the app is running:

| | URL |
| --- | --- |
| Swagger UI | <http://localhost:3000/swagger-ui.html> |
| OpenAPI JSON | <http://localhost:3000/v3/api-docs> |
| OpenAPI YAML | <http://localhost:3000/v3/api-docs.yaml> |

To call a protected route from the UI: run `POST /auth/login` (demo: `SHOP_OWNER` /
`owner@shop.com` / `secret123`), copy the `token`, click **Authorize**, paste it.

Both doc URLs are `permitAll` in `SecurityConfig` — restrict or exclude them before
shipping to production.

The tables below are the same contract, for when the app isn't running. Routes are
served at the root: this backend has no `/api` prefix, unlike the NestJS one.

### Public

| Method | Path | Body / query |
| --- | --- | --- |
| `POST` | `/auth/login` | `{ roleKey, email?, password?, phone?, pin? }` → `{ user, role, token }` |
| `GET` | `/queue/status/{entryId}` | → one customer's status, place in line, and wait estimate |
| `POST` | `/queue/join` | `{ shopId, service, phone?, name? }` → `201` |
| `POST` | `/queue/leave` | `{ entryId }` |
| `GET`/`POST` | `/webhook/whatsapp` | Meta calls this, not your frontend — see [ARCHITECTURE.md](ARCHITECTURE.md) |

### Authenticated

| Method | Path | Roles |
| --- | --- | --- |
| `GET` | `/auth/me` | any |
| `GET` | `/shops` | any — open shops only, closed ones are hidden |
| `GET` | `/shops/{id}` | any — works for closed shops too |
| `POST` | `/shops` | `SUPER_ADMIN` |
| `POST` | `/shops/{id}/close`, `/shops/{id}/open` | `SUPER_ADMIN`, or the `SHOP_OWNER` of that shop |
| `GET` | `/queue/board` | `?shopId=…` → full queue snapshot — `SHOP_OWNER`, `BARBER_STAFF` |
| `POST` | `/queue/walkin` | `SHOP_OWNER`, `BARBER_STAFF` |
| `POST` | `/queue/next` | `SHOP_OWNER`, `BARBER_STAFF` |
| `POST` | `/queue/skip` | `SHOP_OWNER`, `BARBER_STAFF` |
| `POST` | `/queue/no-show` | `SHOP_OWNER`, `BARBER_STAFF` |
| `POST` | `/queue/notify` | `SHOP_OWNER`, `BARBER_STAFF` |

Send the token as `Authorization: Bearer <token>`.

### Realtime

STOMP over WebSocket at `ws://localhost:3000/ws` (SockJS fallback at the same path).
Subscribe to `/status/queue/{shopId}`; every mutation publishes the same payload as
`GET /queue/board`. The WebSocket topic itself is `permitAll` (see `SecurityConfig`) —
consuming it doesn't require a token even though the equivalent poll now does.

```js
import { Client } from '@stomp/stompjs';

const client = new Client({ brokerURL: 'ws://localhost:3000/ws' });
client.onConnect = () =>
  client.subscribe(`/status/queue/${shopId}`, (msg) => setQueue(JSON.parse(msg.body)));
client.activate();
```

---

## Differences from the NestJS backend

- **Realtime is STOMP, not Socket.io.** The two protocols are not wire compatible. A
  frontend talking to this backend swaps `socket.io-client` for `@stomp/stompjs`, and
  `socket.emit('queue:subscribe')` becomes a subscription to `/status/queue/{shopId}`.
- **Postgres instead of SQLite**, with Flyway owning the schema and Hibernate set to
  `validate` — it will refuse to start if the entities and the migration disagree.
- **No `/api` prefix.** NestJS sets a global `api` prefix; here routes are served at the
  path their controller declares, so `/api/queue/next` becomes `/queue/next`.
- **`POST /queue/notify` returns `204`** instead of `{ ok: true }`.
- **Enums are enforced.** `service`, `status`, and notification `type` are real Java enums
  with matching SQL `CHECK` constraints, where the Prisma schema stored free strings.
- **`position` is stored as `queue_position`** — `POSITION` is reserved in SQL.
- Requests are validated and unknown JSON properties are ignored, matching the NestJS
  `ValidationPipe({ whitelist: true })` behaviour.

---

## Database

### Credentials

Local defaults, defined in `compose.yaml` and matched by `application.yml`:

| | |
| --- | --- |
| Host / port | `localhost:5432` |
| Database | `smartqueue` |
| User / password | `smartqueue` / `smartqueue` |
| JDBC URL | `jdbc:postgresql://localhost:5432/smartqueue` |

### Where the connection string lives

Three files, and it matters which one you edit:

| File | Role |
| --- | --- |
| [`compose.yaml`](compose.yaml) | Creates the database, user, and password in the container |
| [`src/main/resources/application.yml`](src/main/resources/application.yml) | What the app connects with — reads `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, falling back to the local defaults |
| [`.env.example`](.env.example) | Documentation of the available variables. **Template only** |

```yaml
# application.yml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/smartqueue}
    username: ${DATABASE_USER:smartqueue}
    password: ${DATABASE_PASSWORD:smartqueue}
```

Changing the credentials means editing **both** `compose.yaml` (so the container is
created that way) and your environment (so the app connects that way) — and `down -v`
first, since Postgres only applies `POSTGRES_*` when it initialises an empty volume.

> **`.env` is not loaded automatically.** Unlike the NestJS backend, Spring Boot does not
> read `.env` files. Either export the variables into your shell:
>
> ```bash
> set -a; source .env; set +a
> ./mvnw spring-boot:run
> ```
>
> or pass them inline: `DATABASE_URL=... ./mvnw spring-boot:run`

### Connecting a client

```bash
# psql inside the container — nothing to install
docker exec -it smart-queue-postgres psql -U smartqueue -d smartqueue

# one-off query
docker exec smart-queue-postgres psql -U smartqueue -d smartqueue -c "select token, status from queue_entries order by queue_position;"
```

For DBeaver / TablePlus / DataGrip / pgAdmin, use host `localhost`, port `5432`,
database `smartqueue`, user `smartqueue`, password `smartqueue` — the port is published
by `compose.yaml`, so no extra setup is needed.

Tables: `shops`, `users`, `queue_entries`, `notifications`, plus Flyway's
`flyway_schema_history`.

### Changing the schema

Flyway owns it and Hibernate is set to `validate`, so the app refuses to start if the
entities and the migration disagree. A column change is three coordinated edits:

1. a new `src/main/resources/db/migration/V2__your_change.sql` — never edit `V1`, it's
   already applied and checksummed
2. the matching field in the `*JpaEntity`
3. the matching line in `PersistenceMapper`

The domain record only changes if the *business* meaning changed.

### Pointing at a hosted database

Neon, Supabase, RDS — no code change, just variables:

```bash
export DATABASE_URL="jdbc:postgresql://ep-xxx.neon.tech:5432/smartqueue?sslmode=require"
export DATABASE_USER="..."
export DATABASE_PASSWORD="..."
./mvnw spring-boot:run
```

Flyway will create the schema there on first connect.

---

## Configuration

Every value is an environment variable with a working local default. See `.env.example`
for the full list, and the note above on how to actually load it.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/smartqueue` | JDBC URL |
| `DATABASE_USER` / `DATABASE_PASSWORD` | `smartqueue` | credentials |
| `JWT_SECRET` | dev placeholder | HS256 key — **must be ≥ 32 bytes** |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `PORT` | `3000` | HTTP port |
| `CORS_ORIGINS` | Vite + Capacitor origins | comma-separated allowlist |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | empty | set both to leave stub mode |
| `WHATSAPP_VERIFY_TOKEN` | empty | any string you invent — Meta echoes it back on webhook setup |
| `WHATSAPP_APP_SECRET` | empty | signs inbound webhooks; blank = signature check skipped (fine locally, required before public) |
| `WHATSAPP_API_BASE_URL` | `https://graph.facebook.com/v25.0` | overridable so tests can point at a local stub |
| `SEED_DEMO_DATA` | `true` | demo shop and logins on startup |

Typed and bound in [`SmartQueueProperties`](src/main/java/com/smartqueue/config/SmartQueueProperties.java).

---

## Notes

- Virtual threads are on (`spring.threads.virtual.enabled`), so blocking JDBC calls
  don't tie up platform threads.
- The JWT payload (`sub` = user id, `role`) is identical to the NestJS one, so tokens
  issued by either backend are accepted by the other while both run.
- The user is re-read from the database on every authenticated request, so a deleted
  account stops working immediately rather than at token expiry.
