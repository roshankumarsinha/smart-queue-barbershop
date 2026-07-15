# Smart Queue — WhatsApp Barbershop Queue System

A WhatsApp-first virtual queue system for barbershops. Customers join and track their queue position over WhatsApp — no app install required. Barbers manage the queue from a simple web dashboard.

## Why

Barbershops currently manage waits with paper lists or rough verbal estimates. Customers give up and leave when the wait feels uncertain. Smart Queue replaces that with a token system customers can check from their phone, and a dashboard barbers can run with big, fast-tap buttons during busy hours.

## How it works

**Customer flow (WhatsApp):**

1. Customer messages the shop's WhatsApp number
2. Bot asks for service (Haircut / Beard / Haircut + Beard) and shop
3. Bot confirms token number, people ahead, and estimated wait
4. Customer gets a "2 people ahead, start heading over" notification, then a "your turn" notification
5. Customer can Check Status or Leave Queue any time

**Shop flow (Web Dashboard):**

- Next Customer — marks current token done, advances the queue, triggers customer notifications
- Add Walk-in — service → optional phone number → new token generated
- Skip Customer — moves a customer to the end of the queue
- Queue Status — currently serving, full waiting list, total waiting, avg wait time

Actions on the dashboard update the customer's WhatsApp chat in real time (see `/frontend/live-demo` prototype for the pitch version of this).

## Architecture

```
Customer → WhatsApp → Meta WhatsApp Cloud API → Webhook (NestJS) → Queue Service → PostgreSQL
                                                        │
                                                   Socket.io (real-time)
                                                        │
                                                Barber Dashboard (React)
```

## Tech Stack

| Layer     | Choice                        |
| --------- | ----------------------------- |
| Backend   | NestJS (Node.js + TypeScript) |
| Database  | PostgreSQL                    |
| ORM       | Prisma                        |
| Real-time | Socket.io                     |
| Frontend  | React + Vite (TypeScript)     |
| Messaging | Meta WhatsApp Cloud API       |

> Tech stack is a starting recommendation based on early project notes — update this table if it changes.

## Project Structure

```
.
├── backend/        # NestJS API — webhook, queue service, DB access
├── frontend/        # React barber dashboard
├── README.md
├── .gitignore
└── LICENSE
```

## Backend API (draft)

```
POST /join      # customer joins queue
POST /next       # advance to next customer
POST /walkin     # shop adds a walk-in customer
POST /skip       # move a customer to end of queue
GET  /status     # current queue status
POST /leave      # customer leaves queue
POST /notify     # send WhatsApp notification
```

## Database Schema (draft)

**Shop** — id, name, whatsapp_number, active_barbers, avg_service_time

**Queue** — id, shop_id, token, phone, service, status, joined_at

**Notification** — id, queue_id, type, sent_at

## Getting Started

### Prerequisites

- Node.js (LTS)
- PostgreSQL running locally or via Docker
- npm or pnpm

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment variables (WhatsApp API keys, DB connection string, etc.) go in a local `.env` file — never commit this. Use `.env.example` for the shape without real values.

## Branching Strategy

- `main` — stable, protected. No direct pushes.
- `feature/<description>` — new features, e.g. `feature/whatsapp-webhook`
- `fix/<description>` — bug fixes
- `chore/<description>` — tooling, config, docs

All changes go through a Pull Request with at least one review before merging into `main`.

## Contributing (for the two of us)

1. Pull latest `main`:
   ```bash
   git checkout main
   git pull
   ```
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit with clear messages (e.g. `feat: add WhatsApp webhook handler`, `fix: correct queue position calculation`).
4. Push and open a Pull Request:
   ```bash
   git push -u origin feature/your-feature-name
   ```
5. Request review from the other person before merging.

## Roadmap (from project notes)

1. **Prototype 1** — Interactive WhatsApp chat mock (done, see live demo)
2. **Prototype 2** — Barber dashboard mock (done, see live demo)
3. **Prototype 3** — Combined live demo, dashboard actions reflect instantly in WhatsApp mock (done — used for pitching)
4. **Production build** — Real WhatsApp Business Platform integration (Meta Cloud API or Twilio), real backend, real DB — this repo

Note: the current HTML prototype is a pitch/demo tool with a simulated backend. It is not the production system — this repo is where the real backend and dashboard get built.

## License

TBD — add a `LICENSE` file (e.g. MIT) once decided.
