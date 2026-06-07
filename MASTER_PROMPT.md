# 🚨 MASTER PROMPT — Emergency Response AI Platform
### Claude Code Build Specification | Final Version

---

## MISSION

Build a production-grade **Emergency Response AI Platform** split into exactly **two top-level directories**:

- `client/` — React Native Expo app (civilian emergency caller) — **built on top of the existing LiveKit React Native starter template**
- `backend/` — Full backend monorepo containing:
  - `backend/backend/` — Node.js + Express API + WebSocket server
  - `backend/agent/` — Python LiveKit Agent worker (ARIA)
  - `backend/dashboard/` — React + Vite web app with role-based org login

This is a **life-safety application**. Build with extreme reliability, zero silent failures, clean separation of concerns, and no shortcuts.

---

## SYSTEM OVERVIEW

```
[Civilian] 
    │
    ▼
[client/ — React Native App]
    │  Joins LiveKit room via token
    │  Optional photo upload → Cloudinary
    ▼
[LiveKit Cloud Room]
    │
    ├──► [backend/agent/ — Python ARIA Agent]
    │         │  Speaks to caller (Groq LLM + LiveKit built-in STT/TTS)
    │         │  Triages transcript with Groq
    │         │  POST /alert → backend
    │
    ▼
[backend/backend/ — Node.js Express]
    │  Validates alert
    │  Creates EmergencyCase
    │  Broadcasts via WebSocket
    │  Sends LiveKit data message to caller room
    │
    ▼
[backend/dashboard/ — React Web App]
    │  Org logs in (role-based: police/medical/fire/defense)
    │  WS receives only their dept's cases
    │  🔴 RED ALERT NOTIFICATION OVERLAY fires on every new case
    │  Shows ticket details, severity, actions, photo
```

---

## TECH STACK — PINNED VERSIONS

### client/ (React Native)
```json
{
  "expo": "51.0.0",
  "@livekit/react-native": "2.3.0",
  "@livekit/react-native-webrtc": "125.0.7",
  "expo-image-picker": "15.0.7",
  "expo-av": "14.0.7",
  "axios": "1.7.7",
  "uuid": "10.0.0"
}
```

### backend/backend/
```json
{
  "express": "4.18.2",
  "livekit-server-sdk": "2.6.1",
  "ws": "8.18.0",
  "jsonwebtoken": "9.0.2",
  "bcryptjs": "2.4.3",
  "cloudinary": "2.5.1",
  "multer": "1.4.5-lts.1",
  "cors": "2.8.5",
  "dotenv": "16.4.5",
  "uuid": "10.0.0",
  "typescript": "5.4.5",
  "@types/express": "4.17.21",
  "@types/ws": "8.5.12",
  "@types/jsonwebtoken": "9.0.6",
  "@types/bcryptjs": "2.4.6",
  "@types/uuid": "10.0.0",
  "ts-node": "10.9.2"
}
```

### backend/agent/ (Python)
```
livekit-agents==0.8.11
livekit-plugins-openai==0.8.6
livekit-plugins-noise-cancellation==0.2.0
livekit-plugins-livekit==0.1.0
groq==0.9.0
httpx==0.27.2
python-dotenv==1.0.1
```

### backend/dashboard/
```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-router-dom": "6.26.2",
  "vite": "5.4.8",
  "@vitejs/plugin-react": "4.3.1",
  "typescript": "5.4.5"
}
```

---

## ENVIRONMENT VARIABLES

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

## FULL REPOSITORY STRUCTURE

```
emergency-ai-platform/
│
├── client/                              # Built on LiveKit React Native starter template
│   ├── app/
│   │   ├── index.tsx                    # Landing screen — "START EMERGENCY CALL"
│   │   ├── upload.tsx                   # Optional photo upload screen
│   │   └── call.tsx                     # Active voice call screen
│   ├── components/
│   │   ├── VoiceOrb.tsx                 # Animated pulse orb
│   │   ├── StatusBanner.tsx             # Call state display
│   │   └── PhotoPreview.tsx             # Uploaded photo thumbnail
│   ├── hooks/
│   │   └── useLiveKitRoom.ts            # Room connect/disconnect/events
│   ├── services/
│   │   └── api.ts                       # POST /token, POST /upload
│   ├── constants/
│   │   └── theme.ts                     # Colors, typography
│   ├── app.json
│   └── package.json
│
└── backend/
    ├── backend/
    │   ├── src/
    │   │   ├── index.ts                 # Express + WS server entry
    │   │   ├── routes/
    │   │   │   ├── token.ts             # POST /token
    │   │   │   ├── upload.ts            # POST /upload
    │   │   │   ├── alert.ts             # POST /alert (agent only)
    │   │   │   ├── cases.ts             # GET /cases, PATCH /cases/:id/status
    │   │   │   └── auth.ts              # POST /auth/login, GET /auth/me
    │   │   ├── services/
    │   │   │   ├── livekit.ts           # AccessToken generation
    │   │   │   ├── cloudinary.ts        # Upload helper
    │   │   │   ├── ws.ts                # WS server + dept broadcast
    │   │   │   └── caseStore.ts         # In-memory case store
    │   │   ├── middleware/
    │   │   │   └── auth.ts              # JWT verify middleware
    │   │   ├── data/
    │   │   │   └── orgs.json            # Seeded org accounts (generated by seed.ts)
    │   │   └── types.ts
    │   ├── seed.ts                      # Run once to create org accounts
    │   ├── tsconfig.json
    │   └── package.json
    │
    ├── agent/
    │   ├── agent.py                     # LiveKit agent entrypoint
    │   ├── triage.py                    # Groq triage logic
    │   ├── personality.py               # ARIA system prompt
    │   ├── .env
    │   └── requirements.txt
    │
    └── dashboard/
        ├── src/
        │   ├── main.tsx
        │   ├── App.tsx                  # Router + auth guard
        │   ├── pages/
        │   │   ├── Login.tsx
        │   │   ├── Dashboard.tsx        # Shell with sidebar + outlet
        │   │   ├── Incidents.tsx        # Default: live case feed
        │   │   ├── Units.tsx            # Active units placeholder
        │   │   ├── Map.tsx              # Incident map placeholder
        │   │   ├── History.tsx          # Resolved cases
        │   │   └── NotFound.tsx
        │   ├── components/
        │   │   ├── Sidebar.tsx          # Dept-specific nav menu
        │   │   ├── CaseCard.tsx         # Live case card
        │   │   ├── CaseDetail.tsx       # Expanded case modal
        │   │   ├── StatsBar.tsx         # Active/Responding/Resolved counts
        │   │   ├── AlertOverlay.tsx     # 🔴 RED ALERT NOTIFICATION (NEW)
        │   │   ├── AlertBell.tsx        # Bell icon with unread badge
        │   │   └── StatusDot.tsx        # WS live/disconnected indicator
        │   ├── hooks/
        │   │   ├── useAuth.ts           # Login, token, me
        │   │   └── useWebSocket.ts      # WS + alert overlay trigger
        │   ├── context/
        │   │   └── AuthContext.tsx
        │   ├── constants/
        │   │   └── deptConfig.ts        # Per-dept color, icon, menu
        │   └── types.ts
        ├── index.html
        ├── vite.config.ts
        └── package.json
```

---

## PART 1 — backend/backend/

### Types (src/types.ts)

```typescript
export type Department = 'police' | 'medical' | 'fire' | 'defense';
export type Severity   = 'critical' | 'high' | 'medium';
export type CaseStatus = 'active' | 'responding' | 'resolved';

export interface EmergencyCase {
  id: string;           // uuid v4
  department: Department;
  severity: Severity;
  status: CaseStatus;
  summary: string;      // 1-sentence triage summary
  actions: string[];    // exactly 3 action items for responding dept
  photoUrl?: string;
  callerLocation?: string;
  transcript?: string;
  roomName: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;
}

export interface OrgAccount {
  id: string;
  orgName: string;
  department: Department;
  passwordHash: string;
}

// WebSocket message types
export type WsMessageType = 'NEW_CASE' | 'CASE_UPDATE' | 'PING';
export interface WsMessage {
  type: WsMessageType;
  payload: EmergencyCase | { id: string; status: CaseStatus } | null;
}
```

### Org Seeding (seed.ts)

```typescript
// Run: npx ts-node seed.ts
// Creates backend/backend/src/data/orgs.json

import bcrypt from 'bcryptjs';
import fs from 'fs';

const orgs = [
  { id: 'fire-dept-01',   orgName: 'City Fire Department',      department: 'fire',    password: 'fire2024!'    },
  { id: 'medical-01',     orgName: 'Emergency Medical Service',  department: 'medical', password: 'med2024!'     },
  { id: 'police-01',      orgName: 'City Police Department',     department: 'police',  password: 'police2024!'  },
  { id: 'defense-01',     orgName: 'Civil Defense Authority',    department: 'defense', password: 'defense2024!' },
];

const seeded = orgs.map(o => ({
  id: o.id,
  orgName: o.orgName,
  department: o.department,
  passwordHash: bcrypt.hashSync(o.password, 10),
}));

fs.writeFileSync('./src/data/orgs.json', JSON.stringify(seeded, null, 2));
console.log('✅ Orgs seeded to src/data/orgs.json');
```

### Auth Routes (routes/auth.ts)

```typescript
// POST /auth/login
// Body: { orgId: string, password: string }
// 1. Load orgs.json
// 2. Find org by id
// 3. bcrypt.compare(password, org.passwordHash)
// 4. Sign JWT: { orgId, department, orgName }, secret=JWT_SECRET, expiresIn='8h'
// 5. Return: { token, org: { orgName, department } }

// GET /auth/me
// Header: Authorization: Bearer <token>
// Verify JWT, return { orgName, department }

// JWT Middleware (middleware/auth.ts)
// Verifies token, attaches decoded payload to req.org
// Returns 401 if missing or invalid
```

### Token Route (routes/token.ts)

```typescript
// POST /token
// Body: { identity: string, roomName?: string, photoUrl?: string }
// 1. Generate roomName = req.body.roomName || `room-${uuid()}`
// 2. Create AccessToken with identity, ttl '2h'
// 3. Grant: roomJoin, canPublish, canSubscribe, canPublishData
// 4. If photoUrl provided, set it as room metadata via LiveKit RoomServiceClient
// 5. Return: { token, roomName, wsUrl: process.env.LIVEKIT_URL }
```

### Upload Route (routes/upload.ts)

```typescript
// POST /upload
// Multipart form — field name: 'photo'
// multer memoryStorage, max 10MB, accept image/* only
// Upload to Cloudinary with folder: 'emergency-cases'
// Return: { url: string, publicId: string }
```

### Alert Route (routes/alert.ts)

```typescript
// POST /alert
// Header: X-Agent-Secret must match process.env.AGENT_SECRET — return 403 if not
// Body: { department, severity, summary, actions, photoUrl?, callerLocation?, transcript?, roomName }
// 1. Validate all required fields present
// 2. Create EmergencyCase: { id: uuid(), ...body, status: 'active', createdAt, updatedAt }
// 3. caseStore.add(newCase)
// 4. wsService.broadcastToDept(department, { type: 'NEW_CASE', payload: newCase })
// 5. Return: { caseId: newCase.id }
```

### Cases Route (routes/cases.ts)

```typescript
// GET /cases — requires JWT auth middleware
// Returns all cases for req.org.department (from caseStore.getByDept)

// PATCH /cases/:id/status — requires JWT auth middleware
// Body: { status: CaseStatus }
// Updates case, broadcasts { type: 'CASE_UPDATE', payload: { id, status } } to dept
// Returns updated case
```

### WebSocket Server (services/ws.ts)

```typescript
// Mount on same HTTP server as Express using server.on('upgrade', ...)
// Upgrade path: /ws?token=<jwt>
// On new connection:
//   1. Parse token from query string
//   2. Verify JWT using JWT_SECRET
//   3. Extract department from payload
//   4. Register: wsClients.set(ws, { department, orgName })
//   5. Send: { type: 'PING', payload: null } immediately to confirm connection
// Keep-alive: setInterval ping every 25 seconds
// On close: delete from wsClients Map
//
// broadcastToDept(dept, message):
//   Iterate wsClients, send to matching department only
//   Skip closed/closing connections
//
// All messages are JSON.stringify(WsMessage)
```

### Case Store (services/caseStore.ts)

```typescript
// In-memory Map<string, EmergencyCase>
// add(c: EmergencyCase): void
// getById(id: string): EmergencyCase | undefined
// getByDept(dept: Department): EmergencyCase[]  — sorted by createdAt desc
// updateStatus(id: string, status: CaseStatus): EmergencyCase | undefined
// getAll(): EmergencyCase[]
```

### Server Entry (src/index.ts)

```typescript
// 1. Express app with cors, json, urlencoded
// 2. Routes: /token, /upload, /alert, /cases, /auth
// 3. Create HTTP server from Express app
// 4. Attach WS service to HTTP server upgrade event
// 5. server.listen(PORT)
// Log all incoming requests with method + path
```

---

## PART 2 — backend/agent/

### personality.py

```python
ARIA_SYSTEM_PROMPT = """
You are ARIA — an AI emergency dispatch assistant. A civilian in distress is calling you.

PERSONALITY:
- EMPATHETIC: Warm presence. They must feel heard instantly.
- PRACTICAL: Clear, actionable. No filler words.
- BRAVE: Project calm confidence. Never sound alarmed.
- FOCUSED: One question at a time. Every sentence has purpose.

CONVERSATION PROTOCOL:
1. Opening words ALWAYS: "I'm here with you. You're safe to talk. What's happening right now?"
2. Listen fully. Do not interrupt unless 10+ seconds of silence.
3. Gather ONLY what you need: What happened? Where are you? Are you physically safe?
4. Never ask more than one question per turn.
5. Once you have enough context (2-3 caller turns), confirm:
   "Okay. I'm alerting [department] right now. Help is on the way. Stay on the line."
6. Give 1-2 immediate safety instructions appropriate to the situation.
7. Keep talking calmly. Never say goodbye first.
8. If 10 seconds of silence: "Are you still there? I'm listening."

NEVER:
- Say "How can I help you today?" or any customer-service opener
- Ask for name, ID, or any identifying info
- Acknowledge you are an AI unless directly asked
- Use alarming words: "dangerous", "terrible", "critical"
- Give multiple instructions at once
"""
```

### triage.py

```python
import os, json
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])

TRIAGE_SYSTEM = """
You are an emergency triage classifier. Analyze a conversation transcript between an AI agent and a distressed civilian.

Determine:
1. department — exactly one of:
   "police"  → crime, assault, theft, threat, domestic violence, kidnapping, suspicious activity
   "medical" → injury, illness, overdose, cardiac arrest, choking, unconscious person, childbirth
   "fire"    → fire, explosion, gas leak, smoke, building collapse, chemical spill
   "defense" → terrorism, mass casualty, civil unrest, biological/chemical threat, hostage

2. severity — exactly one of:
   "critical" → life is at immediate risk right now
   "high"     → serious injury/threat, minutes matter
   "medium"   → urgent but caller is currently stable

3. summary — one sentence (max 15 words) describing the emergency for dispatchers

4. actions — array of exactly 3 specific action items for the RESPONDING DEPARTMENT (not the caller)

5. callerLocation — extract verbatim if mentioned, else null

Respond ONLY with valid compact JSON. No markdown. No explanation. No extra keys.
{"department":"...","severity":"...","summary":"...","actions":["...","...","..."],"callerLocation":"..."}
"""

def triage_transcript(transcript: str) -> dict:
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": TRIAGE_SYSTEM},
            {"role": "user",   "content": f"TRANSCRIPT:\n{transcript}"}
        ],
        temperature=0.1,
        max_tokens=512,
    )
    raw = resp.choices[0].message.content.strip()
    # Strip accidental markdown fences
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)
```

### agent.py

```python
import asyncio, os, httpx
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.agents import llm
from livekit.plugins import openai as lk_openai
from livekit.plugins import livekit as lk_builtin   # LiveKit Cloud STT + TTS
from livekit.plugins import noise_cancellation

from personality import ARIA_SYSTEM_PROMPT
from triage import triage_transcript

load_dotenv()

GROQ_BASE_URL     = "https://api.groq.com/openai/v1"
GROQ_API_KEY      = os.environ["GROQ_API_KEY"]
BACKEND_ALERT_URL = os.environ["BACKEND_ALERT_URL"]
AGENT_SECRET      = os.environ["AGENT_SECRET"]

# Track which rooms have already had an alert sent
alerted_rooms: set[str] = set()

def prewarm(proc: JobProcess):
    pass  # Add any heavy preloads here

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=ARIA_SYSTEM_PROMPT,
    )

    # Groq via OpenAI-compatible endpoint
    groq_llm = lk_openai.LLM(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        base_url=GROQ_BASE_URL,
    )

    # LiveKit Cloud built-in STT and TTS — no external keys required
    stt = lk_builtin.STT()
    tts = lk_builtin.TTS()

    assistant = VoiceAssistant(
        vad=lk_openai.realtime.RealtimeModel(),
        stt=stt,
        llm=groq_llm,
        tts=tts,
        chat_ctx=initial_ctx,
        allow_interruptions=True,
        interrupt_speech_duration=0.5,
        min_endpointing_delay=0.3,
    )

    transcript_parts: list[str] = []
    caller_turns = 0

    @assistant.on("user_speech_committed")
    def on_user(msg: llm.ChatMessage):
        nonlocal caller_turns
        transcript_parts.append(f"Caller: {msg.content}")
        caller_turns += 1
        if caller_turns >= 3:
            asyncio.create_task(attempt_triage(ctx, transcript_parts[:]))

    @assistant.on("agent_speech_committed")
    def on_agent(msg: llm.ChatMessage):
        transcript_parts.append(f"ARIA: {msg.content}")

    assistant.start(ctx.room)

    await assistant.say(
        "I'm here with you. You're safe to talk. What's happening right now?",
        allow_interruptions=True,
    )

    await asyncio.sleep(600)  # Max 10-minute call

async def attempt_triage(ctx: JobContext, transcript: list[str]):
    room_name = ctx.room.name
    if room_name in alerted_rooms:
        return

    full_transcript = "\n".join(transcript)

    try:
        result = triage_transcript(full_transcript)
    except Exception as e:
        print(f"[TRIAGE ERROR] {e}")
        return

    alerted_rooms.add(room_name)

    # Extract photo URL from room metadata if present
    photo_url = ctx.room.metadata if ctx.room.metadata and ctx.room.metadata.startswith("http") else None

    payload = {
        **result,
        "photoUrl":   photo_url,
        "transcript": full_transcript,
        "roomName":   room_name,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                BACKEND_ALERT_URL,
                json=payload,
                headers={"X-Agent-Secret": AGENT_SECRET},
                timeout=8.0,
            )
            print(f"[ALERT] Sent → {resp.status_code} dept={result['department']} severity={result['severity']}")
    except Exception as e:
        print(f"[ALERT ERROR] {e}")
        alerted_rooms.discard(room_name)  # Allow retry

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
```

---

## PART 3 — backend/dashboard/

### Types (src/types.ts)

```typescript
export type Department = 'police' | 'medical' | 'fire' | 'defense';
export type Severity   = 'critical' | 'high' | 'medium';
export type CaseStatus = 'active' | 'responding' | 'resolved';

export interface EmergencyCase {
  id: string;
  department: Department;
  severity: Severity;
  status: CaseStatus;
  summary: string;
  actions: string[];
  photoUrl?: string;
  callerLocation?: string;
  transcript?: string;
  roomName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthOrg {
  orgName: string;
  department: Department;
  token: string;
}
```

### Department Config (constants/deptConfig.ts)

```typescript
export const DEPT_CONFIG = {
  fire: {
    label: 'Fire Department',
    color: '#ff6b35',
    bgDark: '#0f0500',
    icon: '🔥',
    menuItems: [
      { label: 'Live Incidents',  path: '/incidents',  icon: 'AlertTriangle' },
      { label: 'Active Units',    path: '/units',       icon: 'Truck'         },
      { label: 'Incident Map',    path: '/map',         icon: 'Map'           },
      { label: 'Case History',    path: '/history',     icon: 'Archive'       },
      { label: 'Resources',       path: '/resources',   icon: 'Package'       },
    ],
  },
  medical: {
    label: 'Emergency Medical Service',
    color: '#00c896',
    bgDark: '#00100a',
    icon: '🏥',
    menuItems: [
      { label: 'Active Cases',    path: '/incidents',  icon: 'Activity'       },
      { label: 'Ambulance Units', path: '/units',       icon: 'Truck'         },
      { label: 'Patient Intake',  path: '/intake',      icon: 'ClipboardList' },
      { label: 'Case History',    path: '/history',     icon: 'Archive'       },
      { label: 'Hospital Status', path: '/hospitals',   icon: 'Building'      },
    ],
  },
  police: {
    label: 'Police Department',
    color: '#3b82f6',
    bgDark: '#00050f',
    icon: '🚔',
    menuItems: [
      { label: 'Live Incidents',  path: '/incidents',  icon: 'AlertOctagon'  },
      { label: 'Officers on Duty',path: '/units',       icon: 'Shield'        },
      { label: 'Incident Map',    path: '/map',         icon: 'Map'           },
      { label: 'Case History',    path: '/history',     icon: 'Archive'       },
      { label: 'Profiles',        path: '/profiles',    icon: 'User'          },
    ],
  },
  defense: {
    label: 'Civil Defense Authority',
    color: '#ef4444',
    bgDark: '#0f0000',
    icon: '🛡️',
    menuItems: [
      { label: 'Threat Monitor',  path: '/incidents',  icon: 'Radio'         },
      { label: 'Response Teams',  path: '/units',       icon: 'Users'         },
      { label: 'Threat Map',      path: '/map',         icon: 'Map'           },
      { label: 'Incident Log',    path: '/history',     icon: 'Archive'       },
      { label: 'Protocols',       path: '/protocols',   icon: 'BookOpen'      },
    ],
  },
} as const;
```

### 🔴 Alert Overlay — CRITICAL COMPONENT (components/AlertOverlay.tsx)

This is the most important UI feature. Every new incoming case must trigger a full red overlay notification.

```
BEHAVIOUR:
- Triggers automatically on every NEW_CASE WebSocket message
- Renders as a FULL-SCREEN overlay (position: fixed, z-index: 9999)
- Background: rgba(180, 0, 0, 0.96) — deep emergency red
- Plays a short audio alert (Web Audio API beep, no external file needed)
- Stays visible for 8 seconds OR until user clicks "ACKNOWLEDGE"
- If multiple alerts arrive while one is shown, they queue — show next after current is dismissed
- After 8s auto-dismiss, moves case to case feed silently

VISUAL DESIGN:
- Top: Flashing "🚨 EMERGENCY ALERT 🚨" header — CSS keyframe blink animation (1s interval)
- Severity badge: CRITICAL (pulsing white border), HIGH (solid orange), MEDIUM (solid yellow)
- Ticket ID: show first 8 chars of case UUID in monospace
- Timestamp: relative time "Just now"
- Summary: large white text, 24px, centered
- Location: if available, show with 📍 icon
- Actions: numbered list 1. 2. 3. — white, readable
- Photo: if available, show as 200x150 thumbnail on right side
- Bottom: two buttons:
    [ACKNOWLEDGE] — white bg, dark text, bold — closes overlay
    [VIEW FULL CASE] — transparent, white border — closes + opens CaseDetail modal
- Corner countdown: "Auto-dismiss in Xs" counting down from 8

CSS ANIMATION:
@keyframes alertBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
// Apply to header text only, not entire overlay

WEB AUDIO ALERT (no file needed):
function playAlertSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
  // Play 3 times with 600ms gap for CRITICAL severity
}

QUEUE LOGIC (in useWebSocket hook):
- pendingAlerts: EmergencyCase[] state
- activeAlert: EmergencyCase | null state
- On NEW_CASE: push to pendingAlerts
- useEffect: when activeAlert is null and pendingAlerts.length > 0, pop first → set as activeAlert
- AlertOverlay renders when activeAlert !== null
- On dismiss/acknowledge: set activeAlert to null (triggers next in queue)
```

### useWebSocket Hook (hooks/useWebSocket.ts)

```typescript
// Connect: ws://<backend>/ws?token=<jwt>
// Auto-reconnect: exponential backoff — 1s, 2s, 4s, 8s, 16s, max 30s
// Reset backoff on successful connection

// State managed:
//   cases: EmergencyCase[]          — all dept cases, sorted by createdAt desc
//   isConnected: boolean
//   pendingAlerts: EmergencyCase[]  — queue for AlertOverlay
//   activeAlert: EmergencyCase | null

// On NEW_CASE message:
//   1. Prepend case to cases[]
//   2. Push to pendingAlerts[]
//   3. If CRITICAL: play 3-beep alert (playAlertSound × 3)
//   4. If HIGH/MEDIUM: play 1-beep alert

// On CASE_UPDATE message:
//   Update status of matching case in cases[]
//   Broadcast no overlay — status changes are silent

// Expose:
//   updateCaseStatus(id, status) — calls PATCH /cases/:id/status
//   dismissAlert() — sets activeAlert to null, pops next from queue
```

### Auth Flow (context/AuthContext.tsx + hooks/useAuth.ts)

```typescript
// AuthContext provides: { org, login, logout, isLoading }
// org: { orgName, department, token } | null

// login(orgId, password):
//   POST /auth/login
//   On success: store token in localStorage key 'aria_token'
//   Decode JWT payload (atob, no library) to get { orgName, department }
//   Set org in context

// logout():
//   Remove from localStorage
//   Clear org in context
//   Navigate to /login

// On app load:
//   Check localStorage for token
//   If exists: GET /auth/me with Bearer token to validate
//   If valid: restore session
//   If invalid/expired: clear and redirect to /login

// Route guard in App.tsx:
//   <PrivateRoute> component wraps all dashboard routes
//   If not authenticated → redirect to /login
//   If authenticated → render children
```

### App.tsx Routing

```tsx
// Routes:
// /login                    → <Login />          (public)
// /                         → redirect to /incidents (if authed)
// /incidents                → <Incidents />       (private)
// /units                    → <Units />           (private)
// /map                      → <Map />             (private)
// /history                  → <History />         (private)
// /intake                   → <PatientIntake />   (private, medical only)
// /hospitals                → <HospitalStatus />  (private, medical only)
// /profiles                 → <Profiles />        (private, police only)
// /resources                → <Resources />       (private, fire only)
// /protocols                → <Protocols />       (private, defense only)

// <AlertOverlay> renders ABOVE all routes — sits at top level inside AuthProvider
// This way it shows regardless of which page the user is on
```

### Dashboard Shell (pages/Dashboard.tsx)

```
LAYOUT: Flexbox row — [Sidebar 280px fixed] [Main content flex-1 overflow-y-auto]

SIDEBAR:
  Top:
    - Dept icon (large, 40px) + org name
    - Dept color top border (4px solid)
  Middle:
    - Menu items from DEPT_CONFIG[department].menuItems
    - Active item: dept color left border + light bg
    - Hover: subtle bg lift
  Stats section (above logout):
    - Three counters: 🔴 Active N | 🟡 Responding N | 🟢 Resolved N
    - Update reactively from cases[]
  Bottom:
    - StatusDot: green "● LIVE" or red "● DISCONNECTED" + reconnect hint
    - AlertBell: 🔔 icon with red badge showing unread new cases count
    - Logout button

MAIN AREA:
  Header bar: page title + dept label + current time (live clock)
  Content: <Outlet />
```

### Incidents Page (pages/Incidents.tsx)

```
- Renders live cases[] from useWebSocket sorted: CRITICAL first, then HIGH, then MEDIUM, then by time
- Each case → <CaseCard />
- Empty state: "No active incidents" with dept icon
- Top bar: filter buttons [All] [Critical] [High] [Medium]
```

### CaseCard Component (components/CaseCard.tsx)

```
VISUAL:
  - Dark surface card (#1a1a2e or dept-tinted dark)
  - Left accent stripe: CRITICAL=red, HIGH=orange, MEDIUM=yellow (4px)
  - CRITICAL cards: subtle red glow box-shadow + pulse animation

CONTENT:
  Row 1: [Severity badge] [Dept label] [Time elapsed — live "3 min ago"] [Status badge]
  Row 2: Ticket ID (monospace, muted, first 8 chars of UUID)
  Row 3: Summary text (white, 16px)
  Row 4: 📍 Location (if available)
  Row 5: Photo thumbnail 80x60 (if available, click to open full)
  Row 6: Actions chips — first 2 of 3 (abbreviated to 40 chars)
  Row 7: [Mark Responding] [Mark Resolved] buttons — right aligned

INTERACTIONS:
  - Clicking card body → opens <CaseDetail /> modal
  - Buttons only update status via PATCH /cases/:id/status
```

### Login Page (pages/Login.tsx)

```
DESIGN:
  - Full screen dark background matching dept (defaults to #0a0a14 before login)
  - Center card: dark surface, subtle border, 400px wide
  - Platform name: "ARIA Emergency Response" at top with 🚨 icon
  - Fields: Org ID (text), Password (password)
  - Submit button: red (#dc2626), bold "ACCESS SYSTEM"
  - Error state: red text "Invalid credentials. Access denied."
  - Loading state: spinner on button

After success:
  - Brief "ACCESS GRANTED" green flash (500ms)
  - Redirect to /incidents
```

### Dashboard Aesthetics

```css
/* Global CSS variables — set dynamically from DEPT_CONFIG on login */
:root {
  --dept-color:   #3b82f6;   /* Set per department */
  --bg-primary:   #050510;
  --bg-surface:   #0d0d1a;
  --bg-elevated:  #141428;
  --text-primary: #f0f0ff;
  --text-muted:   #6b7280;
  --border:       rgba(255,255,255,0.08);
}

/* Fonts: Load from Google Fonts */
/* Display/headings: 'Rajdhani' — industrial, authoritative */
/* Body/data: 'IBM Plex Mono' — command center feel */
/* UI text: 'DM Sans' — clean, readable */

/* No shadows — use border contrast for depth */
/* Animations: new card slides in from top (0.3s ease-out) */
/* Status badges use background-color + border, never gradients */
```

---

## PART 4 — client/ (React Native — Built on LiveKit Starter Template)

> **NOTE:** Start from the official LiveKit React Native starter template. Modify and extend it — do NOT rewrite from scratch. Preserve the template's existing LiveKit room connection logic and adapt it.

### What to Modify in the Template

```
1. Replace the template's default UI with the emergency-specific screens below
2. Add the photo upload flow BEFORE joining the room
3. Add StatusBanner component on the call screen
4. Add hold-to-hangup (2-second press) replacing any tap-to-end
5. Connect to YOUR backend for token (POST /token) instead of template's token server
6. All other LiveKit connection logic: KEEP AS-IS from template
```

### New Screens

#### app/index.tsx — Landing Screen
```
DESIGN:
  - Background: #080810
  - Center: circular emergency logo (red ring, shield icon)
  - Large button: "START EMERGENCY CALL" — full width, red (#dc2626), 64px height, bold
  - Smaller link below: "Upload Photo First" → navigate to upload screen
  - Bottom muted text: "ARIA Emergency Response System"
  - No nav bar, no menu — single focused screen
```

#### app/upload.tsx — Photo Upload Screen
```
FLOW:
  1. Two options: [Take Photo] [Choose from Gallery] using Expo ImagePicker
  2. On selection: show PhotoPreview component (full width thumbnail)
  3. "Upload & Continue" button → POST /upload (multipart)
  4. On success: store photoUrl in React Context/state
  5. Navigate to call screen with photoUrl in route params
  6. "Skip — Call without photo" link → go directly to call screen

ERROR HANDLING:
  - Upload fails → show red toast "Upload failed. Tap to retry."
  - Permissions denied → show alert with instructions to enable camera
```

#### app/call.tsx — Active Call Screen
```
FLOW:
  1. On mount: call api.ts getToken() → POST /token with { identity: uuid(), photoUrl? }
  2. Connect to LiveKit room using token (use template's connection hook)
  3. Enable microphone immediately
  4. Show call UI

UI ELEMENTS (minimal — 4 elements max):
  - StatusBanner (top): current state text
  - VoiceOrb (center): large animated circle
  - PhotoPreview (bottom-left, small): 60x60 thumbnail if photo was uploaded
  - End Call button (bottom-center): red circle, hold 2 seconds to end

STATUS BANNER STATES (in order):
  "Connecting to ARIA..." → grey
  "ARIA Connected ●"     → green
  "Assessing situation..." → yellow (after first caller speech)
  "🚨 [Dept] Alerted ✓"  → bright red (when agent sends data message)

DEPARTMENT ALERT:
  Backend sends a LiveKit data message to the room when alert fires:
  { type: 'ALERT_SENT', department: 'police' }
  client listens via room.on(RoomEvent.DataReceived, ...) and updates StatusBanner
```

### VoiceOrb Component (components/VoiceOrb.tsx)
```
States:
  connecting → slow grey pulse (opacity 0.3→0.7, 2s cycle)
  agent_speaking → red (#dc2626) pulsing orb with 2 expanding ring animations
  user_speaking → white orb, scale 1.0→1.08, 150ms transition
  silent → dim grey, no animation

Size: 200px diameter
Detect speaking from LiveKit participant audioLevel events (poll every 100ms)
Agent is a RemoteParticipant — listen to their audio levels
User is LocalParticipant

Use React Native Animated API — no third-party animation library
```

### services/api.ts
```typescript
import axios from 'axios';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const getToken = async (identity: string, roomName: string, photoUrl?: string) => {
  const { data } = await axios.post(`${BASE}/token`, { identity, roomName, photoUrl });
  return data as { token: string; roomName: string; wsUrl: string };
};

export const uploadPhoto = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  const { data } = await axios.post(`${BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
};
```

### Client Theme (constants/theme.ts)
```typescript
export const theme = {
  bg:           '#080810',
  surface:      '#0f0f1a',
  red:          '#dc2626',
  redGlow:      '#ff2d2d',
  white:        '#f0f0ff',
  muted:        '#4b5563',
  green:        '#22c55e',
  yellow:       '#eab308',
  fontMono:     'SpaceMono',     // Expo default monospace
  radiusLg:     16,
  radiusFull:   9999,
};
```

---

## ALERT NOTIFICATION — FULL SPECIFICATION

This section is the single most important feature. Read carefully.

### Trigger Conditions
- Every `NEW_CASE` WebSocket message from the backend
- No exceptions — every new case fires the overlay, regardless of severity

### Display Logic
```
Queue-based system:
  - If no alert is currently shown → show immediately
  - If an alert is currently shown → add to queue
  - When user dismisses → auto-show next in queue
  - Auto-dismiss after 8 seconds (but case stays in feed)

Priority: CRITICAL cases jump to front of queue, not back
```

### Visual Specification
```
OVERLAY (position: fixed, inset: 0, z-index: 9999):
  Background: rgba(160, 0, 0, 0.97)
  Backdrop blur: none (performance)
  
  TOP SECTION:
    "🚨 EMERGENCY ALERT 🚨"
    Font: 'Rajdhani', 32px, bold, white
    Animation: blink 1s infinite (opacity 1 ↔ 0.3)
    
  TICKET HEADER ROW:
    Left:  [SEVERITY BADGE] [Dept icon] [Dept label]
    Right: Ticket #{id.slice(0,8).toUpperCase()} | Just now
    
  SEVERITY BADGE STYLES:
    CRITICAL: bg=#ff0000, white text, box-shadow: 0 0 12px #ff0000, pulsing
    HIGH:     bg=#f97316, white text, no glow
    MEDIUM:   bg=#eab308, black text, no glow
    
  MAIN CONTENT (two-column if photo present, else single):
    Left column:
      Summary: 22px white, line-height 1.4, max 3 lines
      Location: "📍 [location]" if available, 14px muted-white
      Divider line
      Actions header: "REQUIRED ACTIONS" 11px uppercase tracking-widest
      Actions list:
        1. [action text]
        2. [action text]
        3. [action text]
        Font: IBM Plex Mono, 14px, white, 1.6 line-height
    
    Right column (only if photoUrl exists):
      img: 200x150, object-fit cover, border 2px solid rgba(255,255,255,0.3)
      
  BOTTOM ROW:
    Left:  Countdown "Auto-dismiss in 7s" (counting down, muted white, 13px)
    Right: [ACKNOWLEDGE] [VIEW FULL CASE]
    
  BUTTON STYLES:
    ACKNOWLEDGE:     bg=white, color=#1a0000, bold, 14px, px-6 py-2, radius-4
    VIEW FULL CASE:  bg=transparent, border=1px solid white, color=white, same size

  ENTRANCE ANIMATION:
    scale: 0.92 → 1.0, opacity: 0 → 1, duration: 200ms, ease-out
    
  EXIT ANIMATION:
    scale: 1.0 → 0.96, opacity: 1 → 0, duration: 150ms, ease-in
```

### Audio Alert (Web Audio API — no file required)
```javascript
function playAlertBeep(times: number = 1, deptColor?: string) {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  
  for (let i = 0; i < times; i++) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 880;
    const start = ctx.currentTime + i * 0.6;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.start(start);
    osc.stop(start + 0.45);
  }
}

// Usage:
// CRITICAL → playAlertBeep(3)
// HIGH     → playAlertBeep(2)
// MEDIUM   → playAlertBeep(1)
```

---

## BACKEND → CLIENT LIVEKIT DATA MESSAGE

When alert fires, backend must notify the mobile caller which department was alerted.

```typescript
// In backend/backend/src/routes/alert.ts
// After storing case and broadcasting to dashboard WS:

import { RoomServiceClient, DataPacket_Kind } from 'livekit-server-sdk';

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

const message = JSON.stringify({
  type: 'ALERT_SENT',
  department: newCase.department,
  severity: newCase.severity,
});

await roomService.sendData(
  roomName,
  Buffer.from(message),
  DataPacket_Kind.RELIABLE,
);
```

```typescript
// In client/hooks/useLiveKitRoom.ts
// Listen for this data message:

room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
  try {
    const msg = JSON.parse(new TextDecoder().decode(payload));
    if (msg.type === 'ALERT_SENT') {
      setAlertedDept(msg.department); // Updates StatusBanner
    }
  } catch {}
});
```

---

## BUILD ORDER

Execute modules in this exact sequence:

```
Step 1: backend/backend/
  - npm install
  - npx ts-node seed.ts          ← creates orgs.json
  - npm run dev
  - Test with curl:
      POST /auth/login            ← verify JWT returned
      POST /token                 ← verify LiveKit token returned
      POST /alert (with X-Agent-Secret header) ← verify WS broadcast

Step 2: backend/agent/
  - pip install -r requirements.txt
  - python agent.py dev           ← joins LiveKit as worker
  - Test by calling into a LiveKit room via LiveKit CLI

Step 3: backend/dashboard/
  - npm install && npm run dev
  - Login with seeded creds (fire-dept-01 / fire2024!)
  - Verify WS connects (green StatusDot)
  - Test AlertOverlay: send mock POST /alert from curl

Step 4: client/
  - Start from LiveKit React Native starter template
  - npm install (new deps only)
  - expo start
  - Test token fetch, room join, microphone enable

Step 5: Integration
  - Full end-to-end: mobile call → ARIA speaks → triage fires →
    dashboard receives → 🔴 AlertOverlay shows → user acknowledges
```

---

## CRITICAL REQUIREMENTS

```
RELIABILITY:
  ✓ All async functions wrapped in try/catch — no silent failures
  ✓ Agent never sends duplicate alerts (alerted_rooms Set)
  ✓ POST /alert rejects without correct X-Agent-Secret header (403)
  ✓ Dashboard WS rejects without valid JWT in query param (close with 1008)
  ✓ WS auto-reconnects with exponential backoff — never permanently disconnected

ALERT OVERLAY:
  ✓ Fires on EVERY new case — no exceptions
  ✓ Queue-based — no alerts are dropped if multiple arrive
  ✓ CRITICAL cases jump to front of queue
  ✓ Audio plays even if user hasn't interacted (use AudioContext after first click)
  ✓ Overlay renders above all other content (z-index: 9999)
  ✓ Auto-dismisses after 8 seconds even if user ignores it

MOBILE CLIENT:
  ✓ Works without photo upload
  ✓ Hold-to-hangup (2 seconds) — never accidental disconnects
  ✓ Handles LiveKit disconnect gracefully (shows reconnecting state)
  ✓ Agent silence timeout at 10 seconds → "Are you still there?"

DASHBOARD:
  ✓ Org sees ONLY their department's cases — enforced server-side
  ✓ WS messages are dept-filtered at broadcast time, not client-side
  ✓ JWT stored in localStorage, validated on every WS connect
  ✓ Session restores on page refresh if token is still valid
```

---

## DELIVERABLES

When build is complete, produce:

```
1. All source files for all 4 modules (client, backend, agent, dashboard)
2. backend/backend/README.md  — API routes, env vars, seed instructions
3. backend/agent/README.md    — Setup, run command, env vars
4. backend/dashboard/README.md — Setup, login credentials table
5. client/README.md          — Expo setup, template modification notes
6. start.sh                  — Starts backend + agent in parallel
7. POSTMAN_COLLECTION.json   — All backend routes with example payloads
8. Root README.md            — Architecture diagram (ASCII), quick start

SEEDED LOGIN CREDENTIALS (include in dashboard README):
  Fire:    Org ID = fire-dept-01   | Password = fire2024!
  Medical: Org ID = medical-01     | Password = med2024!
  Police:  Org ID = police-01      | Password = police2024!
  Defense: Org ID = defense-01     | Password = defense2024!
```

---

*ARIA Emergency Response Platform — Master Build Specification*  
*Stack: LiveKit Cloud + Groq (llama-3.3-70b) + LiveKit STT/TTS + Node.js + Python + React Native + React*
