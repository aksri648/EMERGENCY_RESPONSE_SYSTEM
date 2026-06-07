# ARIA — Emergency Response AI Platform

Life-safety platform that connects a distressed civilian to an AI dispatcher (ARIA) over LiveKit Cloud, triages the situation, and routes a red emergency alert to the correct department's dashboard in real time.

```
[Civilian — React Native]
        │
        │   WebRTC (LiveKit Cloud)
        ▼
  ┌────────────────┐         ┌─────────────────────────────┐
  │ LiveKit Cloud  │◀───────▶│ ARIA Agent (Python)          │
  │   Room         │         │  Groq llama-3.3-70b-versatile│
  └────────┬───────┘         │  LiveKit built-in STT + TTS  │
           │                 │  → POST /alert               │
           │                 └──────────────┬───────────────┘
           │                                │
           │ DataPacket "ALERT_SENT"        │
           │                                ▼
           │            ┌──────────────────────────────────┐
           └───────────▶│  Node.js Backend (Express + WS)  │
                        │  caseStore + dept-filtered WS    │
                        └──────────────┬───────────────────┘
                                       │ NEW_CASE
                                       ▼
                        ┌──────────────────────────────────┐
                        │ React Dashboard (role-based)     │
                        │  🚨 Red AlertOverlay on every    │
                        │     new case + audio beep        │
                        └──────────────────────────────────┘
```

## Repository layout

```
emergency_response/
├── client/         # mobile (LiveKit React Native — modified starter)
├── backend/
│   ├── backend/    # Node.js + Express + WS
│   ├── agent/      # Python LiveKit Agent (ARIA)
│   └── dashboard/  # React + Vite (role-based)
├── start.sh        # boots backend + agent locally
├── POSTMAN_COLLECTION.json
├── MASTER_PROMPT.md     # build spec
├── prompt(1).md         # conversation log
└── project-documentation.md
```

## Quick start

```bash
# 1. backend
cd backend/backend
npm install
cp .env.example .env       # fill in real LiveKit + Cloudinary + Groq creds
npm run seed
npm run dev                # :3000

# 2. agent (separate terminal)
cd backend/agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in LiveKit + Groq creds
python agent.py dev

# 3. dashboard (separate terminal)
cd backend/dashboard
npm install
npm run dev                # :5173 → log in as fire-dept-01 / fire2024!

# 4. mobile client (separate terminal)
cd client
npm install
cp .env.example .env       # EXPO_PUBLIC_BACKEND_URL=http://<your-ip>:3000
npx expo start
```

Or use `./start.sh` to boot backend + agent together.

## Seeded org credentials

| Department | Org ID | Password |
|---|---|---|
| Fire    | `fire-dept-01` | `fire2024!` |
| Medical | `medical-01` | `med2024!` |
| Police  | `police-01` | `police2024!` |
| Defense | `defense-01` | `defense2024!` |

## Module READMEs

- [`backend/backend/README.md`](backend/backend/README.md)
- [`backend/agent/README.md`](backend/agent/README.md)
- [`backend/dashboard/README.md`](backend/dashboard/README.md)
- [`client/README.md`](client/README.md)

## End-to-end test (without real LiveKit/Groq)

You can exercise the dashboard flow with `curl`:

```bash
# 1. log in
TOKEN=$(curl -s -X POST localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"orgId":"police-01","password":"police2024!"}' | jq -r .token)

# 2. open the dashboard at http://localhost:5173 (log in as police-01)

# 3. fire a synthetic alert (simulates the agent)
curl -X POST localhost:3000/alert \
  -H 'Content-Type: application/json' \
  -H 'X-Agent-Secret: internal-agent-shared-secret' \
  -d '{
    "department":"police",
    "severity":"critical",
    "summary":"Armed intruder in caller home",
    "actions":["Dispatch nearest patrol","Advise caller to lock door","Notify SWAT"],
    "callerLocation":"742 Evergreen Terrace",
    "roomName":"room-demo"
  }'
```

The dashboard should immediately show the red AlertOverlay with a countdown and audio beep.
