# Emergency Response AI Platform — Full Conversation History
### Project: ARIA | Date: June 7, 2026

---

## Overview

This document captures the complete conversation between Akshat and Claude that led to the design and specification of the **ARIA Emergency Response AI Platform** — a life-safety application built on LiveKit Cloud, Groq LLM, React Native, Node.js, Python, and a role-based React dashboard.

---

## MESSAGE 1 — Akshat

*(Uploaded a handwritten architecture sketch on a diary page)*

**Photo contents (transcribed):**
- UI box labeled "911" with "Upload Photo" and a camera icon, with arrows going to BACKEND
- Backend section: LiveKit → STT, TTS (via LiveKit), Reasoning LLM → API
- LiveKit React Native Agent Template label
- Three Dashboard section listing:
  - Fire Dept Dashboard — Realtime
  - Medical Service Dashboard — Realtime
  - Police Service Dashboard — Realtime
  - Defense Dept Dashboard — Realtime
- Agent section with: ALERT → Police, Medical Services, Fire Dept
- Talk Agent with personality: Empathetic, Practical, Worried, Brave
- Supervise Instructions:
  - To Escape Physical Threat
  - To Administer First Aid → Ask Medical History → Wound/Problems
  - Provide Mental Calming, Empathetic, Explain Situation
- Node JS Backend label at bottom

**Akshat's message:** *(image only — no text)*

---

## MESSAGE 2 — Claude (Response to sketch)

Analyzed the handwritten system architecture diagram and inferred the following:

**Core Architecture:**

*Frontend (Left)*
- UI with photo upload capability and a camera/media component
- Built with LiveKit React Native Agent Template
- Three dashboards for different emergency services

*Backend (Center)*
- LiveKit for real-time communication
- STT + TTS (Speech-to-Text / Text-to-Speech) via LiveKit
- Reasoning LLM with API integration

*Three Dashboards:*
1. Fire Dept Dashboard — Realtime
2. Medical Service Dashboard — Realtime
3. Police Service Dashboard — Realtime
4. Defense Dept Dashboard — Realtime

*Agent System (Right Side)*
- A main Agent that triggers ALERTS routed to: Police, Medical Services, Fire Dept
- A Talk Agent with personality traits: Empathetic, Practical, Worried, Brave
- A Supervise Instructions agent for:
  - Escaping physical threats
  - Administering First Aid (ask medical history, wound/problems)
  - Mental calming — empathetic, explain situation

*Tech Stack:*
- Node.js Backend
- LiveKit (WebRTC + agents)
- LLM with reasoning capability

*Summary:* An AI-powered civilian emergency assistant — someone in distress uploads a photo/video, speaks to an AI agent, which triages the situation and routes alerts to the appropriate emergency service in real time.

Ended with: "Is this something you're actively building?"

---

## MESSAGE 3 — Akshat

> "We will use Livekit Cloud For this. Let's suppose we will use livekit react native starter template and then build this application. Create a final master prompt for Claude code to make this"

**Decisions confirmed:**
- LiveKit Cloud for WebRTC infrastructure
- LiveKit React Native starter template as the base
- Wants a master Claude Code prompt generated

---

## MESSAGE 4 — Claude (First Master Prompt)

Generated a comprehensive master prompt covering:

**Project split:**
- Mobile (React Native + Expo)
- Backend (Node.js + Express)
- Agent (Python LiveKit Agent worker)
- Dashboards (React Vite — separate pages per dept)

**Tech stack:**
- LiveKit Cloud + LiveKit React Native SDK
- Deepgram (STT), ElevenLabs/Cartesia (TTS)
- Claude claude-sonnet-4-20250514 via Anthropic API for reasoning LLM
- Cloudinary for photo storage
- WebSocket (ws package) for dashboard real-time

**Key components:**
- POST /token for LiveKit room token generation
- POST /alert for department routing
- WS server with dept-filtered broadcast
- VoiceAssistant agent with ARIA personality
- Four separate dashboard pages (Fire, Medical, Police, Defense)
- CaseCard component with severity badges
- Auto-reconnecting WebSocket

**Pinned dependency versions provided for all packages.**

**Seeded org accounts for all four departments.**

---

## MESSAGE 5 — Akshat

> "We will use Groq for LLM and Livekit inference providers cloud built in for Stt and TtS and Rest Can be same. For dashboard part Create a single App but with Role based access basically whichever organisation logs in gets their dashboard shown only. The menu of dashboard you have to decide. Make sure The application is divided into two parts One is Client App react native and other is full backend handling livekit Cloud agent system, etc"

**Key refinements:**
1. **LLM → Groq** (not Claude/Anthropic API) — fast inference for voice
2. **STT/TTS → LiveKit Cloud built-in** (no Deepgram or Cartesia keys needed)
3. **Dashboard → Single app** with role-based access (org login → dept-specific view)
4. **Architecture split → Exactly two directories:**
   - `client/` — React Native mobile app
   - `backend/` — Everything else (backend + agent + dashboard)

---

## MESSAGE 6 — Claude (Second Master Prompt — Refined)

Generated updated master prompt with all refinements applied:

**Two-directory structure:**
```
emergency-ai-platform/
├── client/           # React Native Expo
└── backend/
    ├── backend/      # Node.js + Express + WS
    ├── agent/        # Python LiveKit Agent
    └── dashboard/    # React Vite (role-based)
```

**Updated tech stack:**
- Groq (`llama-3.3-70b-versatile`) via OpenAI-compatible endpoint
- LiveKit Cloud built-in STT + TTS (`livekit-plugins-livekit`)
- JWT-based org auth for dashboard (jsonwebtoken + bcryptjs)
- Single dashboard app with `DEPT_CONFIG` driving per-org menus and colors

**Dashboard role-based system:**
- Org logs in with orgId + password
- JWT contains `{ orgId, department, orgName }`
- WS connection validates JWT — dept filtered server-side
- DEPT_CONFIG defined for all 4 departments with unique menu items, colors, icons

**Department menu items defined:**
- Fire: Live Incidents, Active Units, Incident Map, Case History, Resource Status
- Medical: Active Cases, Ambulance Units, Patient Intake, Case History, Hospital Status
- Police: Live Incidents, Officers on Duty, Incident Map, Case History, Suspect Profiles
- Defense: Threat Monitor, Response Teams, Threat Map, Incident Log, Protocol Library

**Agent personality (ARIA) fully specified:**
- Opening words always: "I'm here with you. You're safe to talk. What's happening right now?"
- One question at a time
- Triage fires after 3+ caller turns
- Confirms: "Help is on the way. [Dept] has been notified."

**Internal security:**
- POST /alert protected by `X-Agent-Secret` header
- WS connections require valid JWT in query param
- Org accounts seeded via `seed.ts` — no self-registration

**All pinned dependency versions updated for new stack.**

---

## MESSAGE 7 — Akshat

> "On Every New alert a Red Warning Notification Should Show With Ticket Details. And We already have livekit react native starter template for client react native app. Create a final master prompt.md file compiling every information to make this"

**Final refinements:**
1. **Alert Overlay** — every new case triggers a red full-screen notification with ticket details
2. **Client is built ON the existing LiveKit starter template** — modify, don't rewrite
3. **Output as `.md` file** — final deliverable

---

## MESSAGE 8 — Claude (Final MASTER_PROMPT.md)

Generated `MASTER_PROMPT.md` — the complete production build specification.

**New additions in final version:**

**AlertOverlay component (fully specced):**
- Triggers on every `NEW_CASE` WebSocket message — no exceptions
- Queue-based: multiple alerts don't collide, CRITICAL cases jump to front
- Full-screen overlay: `position: fixed, inset: 0, z-index: 9999`
- Background: `rgba(160, 0, 0, 0.97)` — deep emergency red
- Flashing "🚨 EMERGENCY ALERT 🚨" header with CSS blink animation
- Severity badges: CRITICAL (pulsing glow), HIGH (orange), MEDIUM (yellow)
- Ticket ID, timestamp, summary, location, numbered actions, photo thumbnail
- Two buttons: ACKNOWLEDGE | VIEW FULL CASE
- Countdown timer: "Auto-dismiss in Xs" from 8 seconds
- Entrance animation: scale 0.92→1.0, opacity 0→1 (200ms ease-out)

**Web Audio API beep (no external file):**
```javascript
// CRITICAL → 3 beeps, HIGH → 2 beeps, MEDIUM → 1 beep
// Square wave oscillator at 880Hz, 450ms duration each, 600ms gap
```

**LiveKit data message pipeline:**
- When alert fires, backend sends `DataPacket` into the LiveKit room
- Message: `{ type: 'ALERT_SENT', department: 'police', severity: 'critical' }`
- Mobile client listens via `RoomEvent.DataReceived`
- Updates `StatusBanner` to "🚨 Police Alerted ✓"

**Client framing:**
- Explicitly stated: start from LiveKit React Native starter template
- Only add/modify specified screens — preserve all existing template connection logic
- New screens: `index.tsx` (landing), `upload.tsx` (photo), `call.tsx` (active call)
- New components: VoiceOrb, StatusBanner, PhotoPreview
- New hook: `useLiveKitRoom.ts` (extends template's existing room logic)

**Hold-to-hangup:**
- End call button requires 2-second press hold
- Prevents accidental disconnection during emergency call

---

## MESSAGE 9 — Akshat

> "Create a prompt.md file with all our conversation history"

---

## MESSAGE 10 — Claude

*(This document)*

Generated `prompt.md` — a full chronological record of the conversation, decisions, refinements, and all technical context that led to the final ARIA Emergency Response AI Platform specification.

---

## Final Architecture Summary

```
[Civilian — React Native App (client/)]
    │
    │  Joins LiveKit Cloud room via token from backend
    │  Optional: uploads photo to Cloudinary
    │
    ▼
[LiveKit Cloud Room]
    │
    ├──► [Python Agent Worker (backend/agent/)]
    │         ARIA personality — empathetic, practical, brave
    │         Groq LLM (llama-3.3-70b-versatile) for conversation
    │         LiveKit Cloud built-in STT + TTS (no external keys)
    │         Triage fires after 3+ caller turns via Groq
    │         POST /alert → backend (X-Agent-Secret header)
    │         Sends LiveKit DataPacket to room → mobile StatusBanner updates
    │
    ▼
[Node.js Backend (backend/backend/)]
    │  Validates X-Agent-Secret
    │  Creates EmergencyCase (uuid, severity, dept, actions, etc.)
    │  Stores in in-memory caseStore (Map)
    │  Broadcasts NEW_CASE via WebSocket to dept-matching dashboard clients
    │  Sends DataPacket to LiveKit room to notify mobile caller
    │
    ▼
[React Dashboard (backend/dashboard/)]
    Org login → JWT with dept → WS connects with JWT in query
    Backend filters WS broadcast by department — org sees ONLY their cases
    
    On NEW_CASE received:
      → Prepend to live feed
      → Push to alertQueue
      → Play audio beep (1-3 times based on severity)
      → Show AlertOverlay (red full-screen notification)
      
    AlertOverlay shows:
      → 🚨 EMERGENCY ALERT 🚨 (blinking)
      → Severity badge + ticket ID + dept
      → Summary, location, actions list, photo
      → ACKNOWLEDGE or VIEW FULL CASE buttons
      → Auto-dismiss after 8 seconds
      → Queue: next alert shows after current dismissed
```

---

## Final Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile | React Native + Expo | 51.0.0 |
| Mobile RTC | LiveKit React Native | 2.3.0 |
| Backend runtime | Node.js + Express | 4.18.2 |
| Backend RTC SDK | livekit-server-sdk | 2.6.1 |
| Backend WS | ws | 8.18.0 |
| Auth | jsonwebtoken + bcryptjs | 9.0.2 / 2.4.3 |
| File storage | Cloudinary | 2.5.1 |
| Agent framework | livekit-agents (Python) | 0.8.11 |
| Agent LLM | Groq llama-3.3-70b-versatile | via groq 0.9.0 |
| Agent STT | LiveKit Cloud built-in | livekit-plugins-livekit |
| Agent TTS | LiveKit Cloud built-in | livekit-plugins-livekit |
| Dashboard | React + Vite | 18.3.1 / 5.4.8 |
| Dashboard routing | React Router v6 | 6.26.2 |

---

## Seeded Org Credentials

| Department | Org ID | Password |
|---|---|---|
| Fire | fire-dept-01 | fire2024! |
| Medical | medical-01 | med2024! |
| Police | police-01 | police2024! |
| Defense | defense-01 | defense2024! |

---

## Environment Variables Summary

```env
# backend/backend/.env
PORT=3000
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-random-32-char-secret-here
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
AGENT_SECRET=internal-agent-shared-secret

# backend/agent/.env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
BACKEND_ALERT_URL=http://localhost:3000/alert
AGENT_SECRET=internal-agent-shared-secret

# client/.env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

---

## Key Design Decisions Log

| Decision | Original | Final | Reason |
|---|---|---|---|
| LLM provider | Claude (Anthropic) | Groq (llama-3.3-70b) | Lower latency for voice |
| STT provider | Deepgram | LiveKit Cloud built-in | Fewer API keys, native integration |
| TTS provider | ElevenLabs/Cartesia | LiveKit Cloud built-in | Same as above |
| Dashboards | 4 separate apps | 1 app, role-based auth | Simpler deployment |
| Repo structure | 4 flat dirs | client/ + backend/ monorepo | Clean client/backend split |
| Alert UX | Case appears in feed | Red overlay + feed | Life-safety requires immediate attention |
| Mobile base | Build from scratch | Extend LiveKit starter template | Faster, more reliable |
| Call end UX | Tap to end | Hold 2s to end | Prevent accidental hangup |

---

*ARIA Emergency Response Platform — Conversation Log*
*Participants: Akshat (founder) + Claude (Anthropic)*
*Session date: June 7, 2026*
