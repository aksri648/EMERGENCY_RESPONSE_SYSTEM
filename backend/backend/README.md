# ARIA Backend

Node.js + Express + WebSocket server for the ARIA Emergency Response Platform.

## Setup

```bash
npm install
cp .env.example .env       # then fill in real values
npm run seed               # generates src/data/orgs.json
npm run dev                # starts on PORT (default 3000)
```

## Environment

See `.env.example`. All values are required.

## Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/health` | — | liveness probe |
| POST | `/auth/login` | — | exchange `{ orgId, password }` → `{ token, org }` |
| GET  | `/auth/me` | Bearer JWT | current org info |
| POST | `/token` | — | LiveKit room access token |
| POST | `/upload` | — | multipart `photo` → Cloudinary URL |
| POST | `/alert` | `X-Agent-Secret` header | agent-only; creates case + broadcasts |
| GET  | `/cases` | Bearer JWT | list cases for caller's department |
| PATCH | `/cases/:id/status` | Bearer JWT | update status (active/responding/resolved) |

### WebSocket

`ws://host/ws?token=<jwt>` — dashboard listens here. Messages are dept-filtered server-side.

```ts
type WsMessage =
  | { type: 'PING'; payload: null }
  | { type: 'NEW_CASE'; payload: EmergencyCase }
  | { type: 'CASE_UPDATE'; payload: { id: string; status: CaseStatus } };
```

## Seeded org credentials

| Department | Org ID | Password |
|---|---|---|
| Fire    | `fire-dept-01` | `fire2024!` |
| Medical | `medical-01` | `med2024!` |
| Police  | `police-01` | `police2024!` |
| Defense | `defense-01` | `defense2024!` |
