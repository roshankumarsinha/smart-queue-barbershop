# Smart Queue — Architecture & Setup

This is the Java/Spring Boot rewrite of the queue-management backend (see the root
[README](../README.md) for how this relates to the original NestJS `backend/`). This
document covers how the code is organized, what's been built, and how to run it —
including the WhatsApp bot, which is the part with real external setup involved.

For the full HTTP route table, request/response shapes, and demo logins, see
[README.md](README.md) — this file is architecture and setup, not API reference.

## Architecture: ports and adapters

The code is organized hexagonally. Business logic never imports a framework class;
frameworks (Spring, JPA, the WhatsApp Cloud API) only ever implement an interface the
business logic defined.

```
src/main/java/com/smartqueue/
├── domain/                      # No framework imports at all
│   ├── Role, QueueStatus, ServiceType, NotificationType, AuthMethod, ShopStatus
│   ├── model/                   # Shop, User, QueueEntry, Notification (immutable records)
│   └── exception/               # NotFoundException, ConflictException, InvalidCredentialsException
│
├── application/
│   ├── port/in/                 # What the app can do — one interface per use case
│   │   ├── GetQueueStatusUseCase, JoinQueueUseCase, AdvanceQueueUseCase,
│   │   │   UpdateQueueEntryUseCase, NotifyCustomerUseCase, LoginUseCase,
│   │   │   ManageShopsUseCase, HandleWhatsAppMessageUseCase
│   │   ├── command/             # JoinQueueCommand, LoginCommand, InboundWhatsAppMessage, …
│   │   └── result/               # QueueSnapshot, JoinQueueResult, QueueEntryStatus, …
│   ├── port/out/                # What the app needs — implemented by adapters
│   │   ├── ShopRepository, UserRepository, QueueEntryRepository, NotificationRepository
│   │   └── NotificationSender, WhatsAppClient, QueueEventPublisher, PasswordHasher,
│   │       AccessTokenIssuer
│   └── service/                 # QueueService, AuthService, ShopService,
│                                #   CustomerNotificationService, WhatsAppConversationService
└── adapter/
    ├── in/web/                  # REST controllers, request/response DTOs, error handler
    │   ├── security/            # JwtAuthenticationFilter, AuthenticatedUser principal
    │   └── WhatsAppWebhookController  # GET verify handshake + POST inbound messages
    └── out/
        ├── persistence/         # JPA entities, Spring Data repos, port adapters, mapper
        ├── security/            # JwtTokenService (jjwt), BCryptPasswordHasher
        ├── websocket/           # StompQueueEventPublisher
        └── notification/        # WhatsAppCloudApiClient — implements both
                                 #   NotificationSender and WhatsAppClient; stub-mode
                                 #   (logs instead of sending) until WHATSAPP_TOKEN +
                                 #   WHATSAPP_PHONE_NUMBER_ID are set

config/                          # SecurityConfig, SmartQueueProperties, OpenApiConfig,
                                 #   WebSocketConfig, DemoDataSeeder
```

Why this matters day to day: `QueueService` (the core business logic) has no idea
whether it's being called from a REST controller or the WhatsApp webhook — both go
through the same `JoinQueueUseCase.join(...)`. That's what let the WhatsApp bot reuse
every existing validation and notification rule (closed-shop rejection, the JOINED
message, etc.) instead of re-implementing them.

Two deliberate concessions to pragmatism: application services carry `@Service` and
`@Transactional`, and `StompQueueEventPublisher` reuses the web layer's
`QueueStatusResponse` so a pushed update is byte-identical to a polled one.

### Mapping from the NestJS backend

This is a port of [`backend/`](../backend) (NestJS + Prisma + SQLite) — same REST
contract, same JWT payload, same roles, so the existing frontend can point at either
by changing `VITE_API_BASE_URL`. The one incompatible piece is realtime (STOMP here,
Socket.io there — see [README.md § Differences](README.md#differences-from-the-nestjs-backend)).

| NestJS | Here |
| --- | --- |
| `QueueService` | `application/service/QueueService` |
| `QueueController` | `adapter/in/web/QueueController` |
| `PrismaService` + Prisma models | `adapter/out/persistence/*` behind `*Repository` ports |
| `QueueGateway` (Socket.io) | `adapter/out/websocket/StompQueueEventPublisher` |
| `NotificationsService` | `CustomerNotificationService` + `WhatsAppCloudApiClient` |
| `JwtStrategy` / `JwtAuthGuard` | `adapter/in/web/security/JwtAuthenticationFilter` |
| `RolesGuard` + `@Roles()` | `@PreAuthorize` + `@EnableMethodSecurity` |
| `@CurrentUser()` decorator | `@AuthenticationPrincipal AuthenticatedUser` |
| `class-validator` DTOs | Jakarta Validation on request records |
| `ValidationPipe` errors | `ApiExceptionHandler` (same `{ statusCode, message, error }` shape) |
| `prisma/schema.prisma` | `db/migration/V1__init.sql` (Flyway) |
| `prisma/seed.ts` | `config/DemoDataSeeder` |
| `.env` | `application.yml` + `SmartQueueProperties` |
| _(no equivalent)_ | `config/OpenApiConfig` → Swagger UI |
| _(no equivalent)_ | `WhatsAppWebhookController` + `WhatsAppConversationService` → the WhatsApp bot |

## What's built

**Shops** — CRUD-lite: create (`SUPER_ADMIN`), list (open shops only), fetch by id
(works even when closed), close/reopen (`SUPER_ADMIN` or that shop's own
`SHOP_OWNER`). A shop has a `whatsappNumber` (globally unique, nullable) and an
`address` (free text, nullable).

**Queue** — join (customer or staff walk-in), advance (finish + promote next),
skip, leave, mark no-show, ad-hoc staff notify. Every mutation broadcasts a fresh
snapshot over STOMP (`/status/queue/{shopId}`) and, where relevant, sends a WhatsApp
notification (JOINED, YOUR_TURN, ALMOST_YOUR_TURN for the front two waiting
customers, REMOVED). A closed shop rejects new joins with 409.

**Status lookups** — `GET /queue/status/{entryId}` (public, the entryId is the
credential) for one customer's live position; `GET /queue/board?shopId=` (staff-only)
for the whole shop's queue.

**Auth** — stateless JWT. Owners/admins sign in with email+password, barbers with
phone+PIN. Role checks are `@PreAuthorize` on the controllers.

**The WhatsApp bot** — a stateful conversation driven entirely by inbound webhook
calls:

```
Meta ──POST /webhook/whatsapp──▶ WhatsAppWebhookController
                                        │ verifies X-Hub-Signature-256,
                                        │ parses the payload into
                                        │ InboundWhatsAppMessage
                                        ▼
                              HandleWhatsAppMessageUseCase
                                        │
                                        ▼
                          WhatsAppConversationService
                     (in-memory per-phone state machine:
                      AWAITING_SERVICE -> AWAITING_SHOP -> joined)
                            │                        │
                            ▼                        ▼
                    JoinQueueUseCase          WhatsAppClient
                    ManageShopsUseCase        (sendText / sendList /
                    GetQueueStatusUseCase      sendButtons)
                    UpdateQueueEntryUseCase           │
                                                       ▼
                                          WhatsAppCloudApiClient
                                          ──POST──▶ Meta Graph API
```

Flow: **Hi** → interactive list of services → pick one → interactive list of open
shops (each row shows live wait) → pick one → registered in the queue, get the
JOINED notification with your token, plus **Check Status** / **Leave Queue** buttons.
**Status** works as a standalone command too, any time, by phone number.

Conversation state (which step a phone number is on) is a plain in-memory
`ConcurrentHashMap` in `WhatsAppConversationService` — deliberately not persisted.
Losing it on a restart just means the customer says Hi again, which is also how
they'd recover from getting stuck anywhere else in the flow.

## Running it locally

```bash
cd backend-java
docker compose up -d              # Postgres on localhost:5432

set -a; source .env; set +a       # loads WHATSAPP_* etc. — see below
./mvnw spring-boot:run            # http://localhost:3000
```

`.env` is gitignored; `.env.example` documents every variable with safe placeholder
values. Copy it if you don't have a `.env` yet. Spring Boot does **not** read `.env`
automatically (unlike the NestJS backend) — always `source` it first, or pass values
inline (`WHATSAPP_TOKEN=... ./mvnw spring-boot:run`).

Without any WhatsApp config, the app runs fine — `WhatsAppCloudApiClient` falls back
to logging `[stub] WhatsApp -> ...` instead of calling Meta, so the queue/shop API
works with zero external setup.

## Enabling the WhatsApp bot for real

Four things, in order. Skipping the middle two is the most common way this looks
"configured" but silently doesn't work.

### 1. Credentials — `backend-java/.env`

```bash
WHATSAPP_TOKEN="<your Cloud API access token>"
WHATSAPP_PHONE_NUMBER_ID="<your phone-number-id>"
WHATSAPP_VERIFY_TOKEN="<any random string you invent>"
WHATSAPP_APP_SECRET="<App Dashboard -> App Settings -> Basic -> App Secret>"
```

`WHATSAPP_VERIFY_TOKEN` isn't issued by Meta — you make it up and it just has to
match on both sides (your `.env` and the dashboard field below). Generate one with
`openssl rand -hex 24`. `WHATSAPP_APP_SECRET` is optional for local testing —
leaving it blank skips inbound signature verification (a warning-worthy state, not
an error) — but is required before this is ever public.

### 2. A public URL for Meta to call

Meta cannot call `localhost`. For local dev, tunnel it:

```bash
brew install cloudflared      # one-time; no account/signup needed
cloudflared tunnel --url http://localhost:3000
```

This prints an `https://<random>.trycloudflare.com` URL. It's ephemeral — restarting
`cloudflared` gives you a new one, which then needs re-pasting into the dashboard
(step 3). For anything longer-lived than a testing session, deploy the app somewhere
with a stable URL instead.

### 3. Register the webhook — Meta App Dashboard

App Dashboard → **WhatsApp** → **Configuration** → **Webhook** → **Edit**:

| Field | Value |
|---|---|
| Callback URL | `https://<your-tunnel-or-host>/webhook/whatsapp` |
| Verify token | the `WHATSAPP_VERIFY_TOKEN` value from your `.env` |

**Verify and Save**, then — separately, easy to miss — find the field-subscription
list next to the webhook and toggle on **`messages`**.

### 4. Subscribe the app to your WhatsApp Business Account

This is the step that's genuinely non-obvious and has no UI in most dashboard
layouts: saving the callback URL registers *an* endpoint, but your WhatsApp Business
Account (WABA) also has to be told to actually send events to *your app*. Skip this
and everything above looks correctly configured — URL verifies fine, Meta's own
"recent deliveries" panel shows the message being processed — but your webhook
never receives a single call.

```bash
# Check who's currently subscribed:
curl -s "https://graph.facebook.com/v25.0/<your-waba-id>/subscribed_apps" \
  -H "Authorization: Bearer $WHATSAPP_TOKEN"

# Subscribe your app (the token's own app) to the WABA:
curl -s -X POST "https://graph.facebook.com/v25.0/<your-waba-id>/subscribed_apps" \
  -H "Authorization: Bearer $WHATSAPP_TOKEN"
```

Your WABA id is in the App Dashboard's WhatsApp API Setup page, or the `entry[].id`
field of any webhook payload Meta shows you in its test/log UI.

### Verifying it end to end

```bash
# The GET handshake Meta performs when you click "Verify and Save":
curl "https://<your-tunnel>/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=<your token>&hub.challenge=test123"
# -> should echo back "test123"

# Whether WHATSAPP_TOKEN itself is still valid — the Cloud API's short-lived tokens
# expire after ~24h, and every send fails with 401 code 190 once that happens:
set -a; source .env; set +a
curl "https://graph.facebook.com/v25.0/me" -H "Authorization: Bearer $WHATSAPP_TOKEN"
# -> { "name": "...", "id": "..." } if valid; an OAuthException if expired
```

A passing GET handshake only proves *your* curl reached the app — it doesn't confirm
Meta's dashboard is actually configured to call this URL. Every time the tunnel
restarts it gets a new address, and Meta only calls whatever is currently saved in
App Dashboard → WhatsApp → Configuration → Webhook → Callback URL. Testing the URL
yourself doesn't register it there — only clicking **Verify and Save** with the new
URL pasted in does.

Then message your WhatsApp Business number with **Hi** from a number added as a
test recipient (App Dashboard → WhatsApp → API Setup → "To" field). Watch the app
log — a working flow shows no errors and a new row in `queue_entries`; a failure
shows `Rejected a WhatsApp webhook call with a missing or invalid signature`
(mismatched `WHATSAPP_APP_SECRET`) or nothing at all reaching the log (step 3 or 4
above wasn't actually completed).

## Notes for whoever deploys this for real

- **Rotate any token that's ever been pasted somewhere transient** (chat, a shared
  terminal, a support ticket) — treat it as burned regardless of whether it made it
  into a file.
- **`WHATSAPP_APP_SECRET` must be set** before this is public. Without it, anyone
  who finds the webhook URL can forge inbound "customer" messages — join people
  into queues, spam the bot — with no way to verify they came from Meta.
- **Interactive list/button messages need no template approval**, unlike a
  business-initiated first contact (which does need an approved template). The bot
  only replies to inbound messages, so this never comes up in the current flow.
- **Quick Tunnels are for testing only.** Anything meant to stay up needs a real
  deployment with a stable HTTPS URL.
