# ARIA — Emergency Response AI Platform

A life-safety platform that connects a distressed civilian to an AI dispatcher
(**ARIA**), triages the situation in real time, and routes a red emergency
alert to the correct department's command dashboard.

```
[Civilian — React Native app (client/)]
        │
        │  WebRTC (LiveKit Cloud)
        ▼
  ┌────────────────┐         ┌──────────────────────────────┐
  │ LiveKit Cloud  │◀───────▶│ ARIA Agent (Python)          │
  │   Room         │         │  Groq llama-3.3-70b-versatile│
  └────────┬───────┘         │  LiveKit STT + TTS           │
           │                 │  Silero VAD                  │
           │                 │  → POST /alert  (when ready) │
           │                 └──────────────┬───────────────┘
           │                                │
           │ DataPacket "ALERT_SENT"        │ JSON + X-Agent-Secret
           │                                ▼
           │            ┌──────────────────────────────────┐
           └───────────▶│  Node.js Backend (Express + WS)  │
                        │  caseStore + dept-filtered WS    │
                        │  JWT auth · LiveKit RoomService  │
                        │  Cloudinary photo upload         │
                        └──────────────┬───────────────────┘
                                       │ WS  /ws?token=<jwt>
                                       │ NEW_CASE · CASE_UPDATE · PING
                                       ▼
                        ┌──────────────────────────────────┐
                        │ React Dashboard (role-based)     │
                        │  🚨 Red AlertOverlay on every    │
                        │     new case + audio beep        │
                        │  Sidebar + Incidents + History   │
                        └──────────────────────────────────┘
```

---

## 1. Repository layout

```
emergency_response/
├── client/                    # React Native + Expo (LiveKit starter, modified)
│   ├── app/                   # expo-router screens
│   ├── components/            # VoiceOrb, StatusBanner, PhotoPreview
│   ├── hooks/                 # useLiveKitRoom
│   ├── services/              # api.ts (POST /token, POST /upload)
│   ├── constants/             # theme.ts
│   ├── assets/images/         # app icon, adaptive icon, splash, favicon
│   ├── app.json               # Expo config (permissions, plugins)
│   └── package.json
│
├── backend/
│   ├── backend/               # Node.js + Express + WS  (port 3000)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/        # auth, token, upload, alert, cases
│   │   │   ├── middleware/    # JWT bearer auth
│   │   │   └── services/      # caseStore, ws, livekit, cloudinary
│   │   ├── seed.ts            # writes src/data/orgs.json
│   │   └── package.json
│   │
│   ├── agent/                 # Python LiveKit Agents worker  ("ARIA")
│   │   ├── agent.py           # VoiceAssistant + triage trigger
│   │   ├── personality.py     # ARIA_SYSTEM_PROMPT
│   │   ├── triage.py          # Groq triage classifier
│   │   └── requirements.txt
│   │
│   └── dashboard/             # React 18 + Vite  (port 5173)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── pages/         # Login, Dashboard, Incidents, History, Placeholder
│       │   ├── components/    # Sidebar, CaseCard, CaseDetail, AlertOverlay
│       │   ├── context/       # AuthContext, CasesContext
│       │   ├── hooks/         # useWebSocket, audio (Web Audio API beeps)
│       │   ├── constants/     # deptConfig (per-dept color/icon/menu)
│       │   ├── styles.css
│       │   ├── types.ts
│       │   └── main.tsx
│       ├── index.html
│       └── package.json
│
├── MASTER_PROMPT.md           # original build specification
├── prompt(1).md               # conversation log
├── project-documentation.md    # ← you are here
├── POSTMAN_COLLECTION.json
├── README.md
└── start.sh                   # boots backend + agent in parallel
```

---

## 2. Data flow (end-to-end)

1. **Civilian opens the app** (`client/`) and taps the red **EMERGENCY** button
   on the landing screen. Two animated pulse rings draw the eye; a
   `phone-classic` icon (`@expo/vector-icons`) labels it.
2. **Optional pre-call photo** — the user can tap *Upload Photo First* to
   pick from camera/gallery via `expo-image-picker`. The image is sent to
   `POST /upload` on the backend, which streams it to **Cloudinary** and
   returns a `url` (`{ url, publicId }`).
3. **Call screen** (`app/call/index.tsx`) starts an audio session via
   `@livekit/react-native` `AudioSession.startAudioSession()` and calls
   `POST /token` with `{ identity, photoUrl? }`. The backend generates a
   **LiveKit AccessToken** (2h TTL, roomJoin+publish+subscribe+data), creates
   a `room-<uuid>` if none was provided, and writes the photo URL to the
   room metadata.
4. **Room connect** — `hooks/useLiveKitRoom.ts` connects, enables the
   microphone, and starts a 100 ms polling loop that reads
   `localParticipant.audioLevel` and the max `audioLevel` of all remote
   participants to drive the `VoiceOrb` UI. Status state machine:

   ```
   idle → connecting → connected → assessing → alerted
                                            ↘ disconnected / error
   ```

5. **ARIA joins** — the Python `agent/agent.py` worker is registered with
   LiveKit Cloud and dispatches a `VoiceAssistant` to any new room. It loads
   the empathetic `ARIA_SYSTEM_PROMPT`, opens with
   *"I'm here with you. You're safe to talk. What's happening right now?"*,
   uses Groq's `llama-3.3-70b-versatile` as the LLM, LiveKit built-in STT/TTS,
   and Silero VAD for turn detection.
6. **Triage** — after ≥ 3 caller turns, `attempt_triage()` is fired
   (`asyncio.create_task` so the live conversation is not blocked). It sends
   the full transcript to `triage.py` → Groq, which returns strict JSON of
   the shape:

   ```json
   {
     "department": "police" | "medical" | "fire" | "defense",
     "severity":   "critical" | "high" | "medium",
     "summary":    "≤ 15 words for dispatchers",
     "actions":    ["…", "…", "…"],
     "callerLocation": "verbatim if mentioned, else null"
   }
   ```

   An in-memory `alerted_rooms: set[str]` prevents duplicate alerts for the
   same LiveKit room.
7. **POST /alert** — the agent POSTs the triage result (+ the photo URL
   pulled from `ctx.room.metadata`, + the full transcript) to the Node
   backend, authenticating with header `X-Agent-Secret: $AGENT_SECRET`.
8. **Backend stores + fans out** — `routes/alert.ts` validates the payload,
   creates an `EmergencyCase` with a uuid, inserts it into the in-memory
   `caseStore`, then:
   - `broadcastToDept(department, { type: 'NEW_CASE', payload: case })` —
     WebSocket fanout to every connected dashboard session whose JWT
     resolved to the same department.
   - `sendRoomData(roomName, { type: 'ALERT_SENT', department, severity })` —
     fires a LiveKit `DataPacket` back into the caller's room.
9. **Caller screen reacts** — `useLiveKitRoom` listens on
   `RoomEvent.DataReceived`; when it sees `ALERT_SENT` it sets
   `alertedDept` and flips the status to `alerted`, which `StatusBanner`
   renders as `🚨 Police Alerted ✓` (or whichever dept).
10. **Dashboard alerts** — `useWebSocket` in the dashboard
    (`backend/dashboard/src/hooks/useWebSocket.ts`) receives `NEW_CASE`,
    prepends it to `cases`, and pushes it onto a `pendingAlerts` queue
    (critical cases jump to the front). An `AudioContext` 880 Hz square
    wave beep plays 1/2/3 times for medium/high/critical severity. The
    queue feeds `AlertOverlay` one alert at a time.
11. **AlertOverlay** (`backend/dashboard/src/components/AlertOverlay.tsx`)
    mounts full-screen on `z-index: 9999` with a red backdrop. It shows
    severity, dept icon+label, ticket id (`#XXXXXXXX`, first 8 of uuid),
    summary, location, the 3 required actions, and (if present) the
    caller's photo. It auto-dismisses after **8 seconds** but the user can
    hit **ACKNOWLEDGE** or **VIEW FULL CASE** (opens the
    `CaseDetail` modal with the full transcript).
12. **Case management** — on `/incidents`, the user can mark a case
    *Responding* or *Resolved*. Each PATCH `…/cases/:id/status` is
    dept-checked, the case is updated in the store, and a
    `CASE_UPDATE` WS message is broadcast back to every tab of the same
    department so multiple operators stay in sync.
13. **Hang up** — the caller long-presses **HOLD TO END** for 2 s; a
    progress fill animates left-to-right, and release-before-complete
    cancels. On completion, `disconnect()` is called and the screen
    navigates back to `/` (the landing).

---

## 3. `client/` — React Native + Expo

Built on the LiveKit React Native starter template. The existing LiveKit
room connection logic is preserved in `hooks/useLiveKitRoom.ts`; everything
else has been replaced with the ARIA emergency call flow.

### Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 56, expo-router (file-based, typed routes enabled) |
| RN | 0.81.5, React 19, New Architecture enabled |
| LiveKit | `livekit-client` 2.15.x, `@livekit/react-native` 2.9.x, `@livekit/react-native-webrtc` 137 |
| Voice orb / animations | `react-native-reanimated` 4 + `react-native-worklets` |
| Icons | `@expo/vector-icons` (uses `MaterialCommunityIcons phone-classic` for the CTA) |
| Image | `expo-image-picker` |
| Identity | `uuid` v4 (no PII collected) |
| Persistence | `react-native-get-random-values` (uuid polyfill) |
| Theme | Custom dark + red emergency palette (`constants/theme.ts`) |

### Screens

| Path | Purpose |
|---|---|
| `app/(start)/index.tsx` | Landing — big red **EMERGENCY** button (220×220 round), `phone-classic` icon, two animated pulse rings, sub-line *"Tap to call ARIA dispatcher"*, secondary link *Upload Photo First* |
| `app/upload/index.tsx`  | Optional photo capture (camera or gallery) and upload; preview tile; *UPLOAD & CONTINUE* / *Skip* buttons |
| `app/call/index.tsx`    | Active call — `VoiceOrb` (220 px), `StatusBanner`, hold-to-hangup; loads `photoUrl` from query params |

### Components

- `components/VoiceOrb.tsx` — animated pulse orb with 4 visual states
  (`connecting` / `agent_speaking` / `user_speaking` / `silent`). Connecting
  state does a 1 Hz opacity pulse, agent-speaking fires two staggered
  ring expansions (700 ms apart), user-speaking gently scales 1.08×.
- `components/StatusBanner.tsx` — color-coded call-state text
  (`Connecting to ARIA…` → `ARIA Connected ●` → `Assessing situation…` →
  `🚨 <Dept> Alerted ✓`).
- `components/PhotoPreview.tsx` — small rounded thumbnail of the uploaded
  photo shown in the call screen.

### Hook

`hooks/useLiveKitRoom.ts` wraps the LiveKit `Room` instance:

- Connects with the provided `wsUrl` + `token`.
- Enables the microphone immediately (`localParticipant.setMicrophoneEnabled`).
- Polls audio levels every 100 ms → `isAgentSpeaking` / `isUserSpeaking`.
- Listens for `RoomEvent.DataReceived`; when the backend posts
  `{ type: 'ALERT_SENT', department }`, status flips to `alerted` and
  `StatusBanner` updates.
- Status promotes to `assessing` automatically the first time the user is
  heard speaking.
- `disconnect()` is async, idempotent, and stops the audio monitor.

### Hold-to-hangup

The end-call button in `app/call/index.tsx` requires a 2-second press hold
(`HOLD_TO_END_MS = 2000`). A progress fill (`width: '0%' → '100%'`)
animates across the button while held; releasing early cancels
(`Animated.timing → 0` in 150 ms).

### Services

`services/api.ts` — two helpers, both rooted at
`process.env.EXPO_PUBLIC_BACKEND_URL` (defaults to `http://localhost:3000`):

- `getToken({ identity, roomName?, photoUrl? })` → `{ token, roomName, wsUrl }`
- `uploadPhoto(localUri)` → returns the Cloudinary `url` (multipart/form-data,
  field name `photo`).

### Permissions

`app.json` declares: `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`,
`ACCESS_NETWORK_STATE`, `INTERNET`, `WAKE_LOCK`, `BLUETOOTH`,
`SYSTEM_ALERT_WINDOW`. iOS `infoPlist` includes the matching
`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`,
`NSPhotoLibraryUsageDescription` strings.

### Setup

```bash
cd client
npm install
cp .env.example .env       # EXPO_PUBLIC_BACKEND_URL=http://<your-ip>:3000
npx expo start
```

> Native modules (LiveKit + WebRTC + camera) require a custom dev client
> the first time: `npx expo run:ios` or `npx expo run:android`.

---

## 4. `backend/backend/` — Node.js + Express + WebSocket

The HTTP + WebSocket core. Issues LiveKit tokens, accepts photo uploads,
validates and stores cases, and fans out department-filtered updates.

### Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node 20, TypeScript 5.4 (`ts-node` for dev) |
| HTTP | `express` 4.18, `cors` 2.8, `multer` 1.4 (memory, 10 MB cap, image-only) |
| Auth | `jsonwebtoken` 9 (HS256, 8 h expiry) + `bcryptjs` 2.4 |
| LiveKit | `livekit-server-sdk` 2.6 (`AccessToken`, `RoomServiceClient`) |
| Cloudinary | `cloudinary` v2 SDK |
| WebSocket | `ws` 8.18 (no `ws` library upgrade of native http server) |
| Misc | `uuid` 10, `dotenv` 16 |

### Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET`  | `/health` | — | Liveness check |
| `POST` | `/auth/login` | — | `{ orgId, password }` → `{ token, org:{ orgName, department } }` |
| `GET`  | `/auth/me` | Bearer JWT | Echo the org identity from the token |
| `POST` | `/token` | — | `{ identity, roomName?, photoUrl? }` → LiveKit `AccessToken` (2 h TTL, roomJoin+publish+subscribe+data) + `wsUrl` |
| `POST` | `/upload` | — | `multipart/form-data`, field `photo`. Streams to Cloudinary (`folder: 'emergency-cases'`). Returns `{ url, publicId }` |
| `POST` | `/alert` | `X-Agent-Secret` | Called by the ARIA Python agent. Validates `department`/`severity`/`actions[]`/`roomName`, creates the case, broadcasts `NEW_CASE` to the matching dept, and `sendRoomData(roomName, { type: 'ALERT_SENT', department, severity })` to the LiveKit room. Returns `{ caseId }` |
| `GET`  | `/cases` | Bearer JWT | Department-filtered list of cases (sorted newest first) |
| `PATCH` | `/cases/:id/status` | Bearer JWT | `{ status }` ∈ {`active`,`responding`,`resolved`}. Enforces *org.department === case.department*. Broadcasts `CASE_UPDATE` to the dept |

### WebSocket

Endpoint: `GET /ws?token=<jwt>` (HTTP upgrade).

- Token verified in the `upgrade` handler before the handshake is
  completed; on failure the socket is destroyed with `HTTP/1.1 401`.
- On connect: sends `{ type: 'PING', payload: null }`.
- Per-client state stored in a `Map<WebSocket, { department, orgName }>`.
- `broadcastToDept(dept, message)` iterates the map, skipping non-matching
  departments and non-`OPEN` sockets. **No cross-department leaks.**
- Server keeps the connection alive with a 25 s server-side `PING`.

### Services

- `services/caseStore.ts` — in-memory `Map<id, EmergencyCase>` with
  `add`, `getById`, `getByDept`, `updateStatus`, `getAll`. Sorted by
  `createdAt` (ISO 8601, lexicographic). Lost on restart (by design — see
  the "Persistence" note in section 8).
- `services/livekit.ts` — `createAccessToken` (2 h TTL, scoped grants),
  `setRoomMetadata` (best-effort, swallows "room not found" because the
  caller may publish metadata via the token instead), `sendRoomData`
  (best-effort, `DataPacket_Kind.RELIABLE` ≡ `0`).
- `services/cloudinary.ts` — single `uploadImage(buffer)` helper that
  uploads via a stream with the `emergency-cases` folder prefix.
- `services/ws.ts` — see WebSocket above.

### Types

```ts
type Department = 'police' | 'medical' | 'fire' | 'defense';
type Severity   = 'critical' | 'high' | 'medium';
type CaseStatus = 'active'  | 'responding' | 'resolved';

interface EmergencyCase {
  id: string;            // uuid v4
  department: Department;
  severity: Severity;
  status: CaseStatus;
  summary: string;       // ≤ 15-word one-liner for dispatchers
  actions: string[];     // exactly 3 action items for the dept
  photoUrl?: string;
  callerLocation?: string;
  transcript?: string;   // full Caller:/ARIA: transcript
  roomName: string;
  createdAt: string;     // ISO 8601
  updatedAt: string;
}
```

### Seeding orgs

`seed.ts` hashes 4 fixed credentials with bcrypt (10 rounds) and writes
`src/data/orgs.json` (created on demand). Idempotent — re-running rewrites
the file.

| Department | Org ID | Password |
|---|---|---|
| Fire    | `fire-dept-01`  | `fire2024!` |
| Medical | `medical-01`    | `med2024!` |
| Police  | `police-01`     | `police2024!` |
| Defense | `defense-01`    | `defense2024!` |

### Setup

```bash
cd backend/backend
npm install
cp .env.example .env       # fill LiveKit + Cloudinary + JWT + AGENT_SECRET
npm run seed               # one-time → writes src/data/orgs.json
npm run dev                # ts-node src/index.ts  (port 3000)
```

---

## 5. `backend/agent/` — Python LiveKit Agent ("ARIA")

The voice-side brain. A LiveKit worker that joins any new room, talks to the
caller with a custom persona, and fires a triage request to Groq after a
short transcript has accumulated.

### Tech stack

| Layer | Choice |
|---|---|
| Framework | `livekit-agents` 0.8.11 (`VoiceAssistant`, `WorkerOptions`, `JobContext`) |
| LLM | `livekit-plugins-openai` 0.8.6 talking to **Groq** (`https://api.groq.com/openai/v1`), `llama-3.3-70b-versatile` |
| STT / TTS | `livekit-plugins-livekit` 0.1.0 (LiveKit Cloud built-in) |
| VAD | `livekit-plugins-silero` 0.7.4 |
| Triage | `groq` 0.9 SDK, same model |
| HTTP | `httpx` 0.27 |
| Config | `python-dotenv` 1.0 |

### Files

- `agent.py` — entrypoint. `prewarm` loads Silero VAD; `entrypoint`
  subscribes to `AUDIO_ONLY`, builds a `ChatContext` seeded with the
  system prompt, instantiates the LLM/STT/TTS, and starts a
  `VoiceAssistant` with `allow_interruptions=True`,
  `interrupt_speech_duration=0.5`, `min_endpointing_delay=0.3`. The first
  utterance is the canned opener from `personality.py`. Two `@assistant.on`
  handlers (`user_speech_committed`, `agent_speech_committed`) append to a
  `transcript_parts` list and increment `caller_turns`; once that hits 3,
  triage runs in a background task. The call self-terminates after 10 min
  (`asyncio.sleep(600)`).
- `personality.py` — `ARIA_SYSTEM_PROMPT` constant. Empathetic, practical,
  brave, focused. Hard rules: never ask for the caller's name, never
  acknowledge being an AI unless directly asked, never use alarming words
  like *"dangerous"* / *"critical"*.
- `triage.py` — `triage_transcript(transcript: str) -> dict`. Calls Groq
  with `temperature=0.1`, `max_tokens=512`, and a strict JSON schema. The
  `TRIAGE_SYSTEM` prompt enumerates the four departments with keyword
  examples, the three severity levels, the 3-action requirement, and
  instructs the model to respond with **only** compact JSON
  (no markdown, no explanation). Validates the response and raises
  `ValueError` on schema violations.

### Triage trigger

```python
if caller_turns >= 3:
    asyncio.create_task(attempt_triage(ctx, list(transcript_parts)))
```

`attempt_triage` is idempotent per room (`alerted_rooms: set[str]`),
forwards the triage dict to the Node backend (with `X-Agent-Secret`),
and on HTTP failure *removes* the room from `alerted_rooms` so a later
turn can retry.

### Setup

```bash
cd backend/agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # LIVEKIT_* + GROQ_API_KEY + BACKEND_ALERT_URL + AGENT_SECRET
python agent.py dev
```

The agent is a *worker*, not a server. It registers with LiveKit Cloud and
sits idle until a room is created. To dispatch a specific agent by name
you would pass `agent_name=...` when generating the access token (the
backend currently does not).

---

## 6. `backend/dashboard/` — React + Vite

The command-center web app. Logs in per department, watches the WS feed,
and slams a full-screen red alert in front of the operator on every new
case.

### Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5, TypeScript 5.4, `react-router-dom` 6.26 |
| Styling | Hand-written CSS in `styles.css` (no Tailwind/CSS-in-JS). Theme via CSS variables, with `--dept-color` swapped at runtime per logged-in org |
| Fonts | Google Fonts: *DM Sans* (body), *Rajdhani* (display), *IBM Plex Mono* (ticket IDs / timestamps) |
| Audio | Native `AudioContext` — 880 Hz square wave, 0.6 s spacing, 1/2/3 beeps for medium/high/critical |

### Port & env

Dev server: `http://localhost:5173`. Configured via
`backend/dashboard/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Routing

| Path | Page | Auth |
|---|---|---|
| `/login` | `Login` | public |
| `/incidents` | `Incidents` — live case feed, filter by severity, sorted critical→medium then newest | required |
| `/history` | `History` — resolved cases, sorted by `updatedAt` desc | required |
| `/units` | `PlaceholderPage` (Active Units / Ambulance Units / Officers on Duty / Response Teams per dept) | required |
| `/map` | `PlaceholderPage` (Incident Map / Threat Map) | required |
| `/intake` / `/hospitals` / `/profiles` / `/resources` / `/protocols` | `PlaceholderPage` (per-dept menu items) | required |
| anything else | → `/incidents` | — |

`PrivateRoute` checks `useAuth().isLoading` → shows a *Loading…* screen,
then redirects to `/login` if there is no `org`.

### State

- `AuthContext` — reads the JWT from `localStorage` under
  `STORAGE_KEY = 'aria_token'`, decodes the `exp` claim, and revalidates
  via `GET /auth/me` on first mount. Exposes `{ org, isLoading, login,
  logout }`.
- `CasesContext` (wraps `useWebSocket`) — single source of truth for the
  case list, the WS connection state, the alert queue, and the
  `updateCaseStatus(id, status)` action.

### WebSocket lifecycle

`useWebSocket` (in `hooks/useWebSocket.ts`):

1. On mount (when `org.token` exists), does a one-time REST
   `GET /cases` to hydrate, then opens
   `ws://<host>/ws?token=<jwt>`.
2. Auto-reconnect with exponential backoff capped at 30 s, doubling from
   1 s on each disconnect. `backoffRef` resets to 1 s on a clean
   `onopen`.
3. On `NEW_CASE`: prepends to `cases` (dedup by id), pushes onto
   `pendingAlerts` (critical → front), and plays
   `playAlertBeep(1|2|3)` by severity.
4. On `CASE_UPDATE`: patches the matching case in place.
5. Server PINGs every 25 s are accepted silently.

A second `useEffect` watches `pendingAlerts` and promotes the head of the
queue to `activeAlert` only when no alert is currently visible — this is
the "queue" that the spec demanded (no alerts dropped; critical jumps
to the front).

### AlertOverlay

`components/AlertOverlay.tsx` renders full-screen on `z-index: 9999` with a
red backdrop. Layout:

- Header `🚨 EMERGENCY ALERT 🚨` (blinks 1 Hz).
- Ticket row: severity badge (critical pulses via `sevPulse` keyframes,
  high is orange, medium is yellow), department icon + label from
  `DEPT_CONFIG`, ticket id `#XXXXXXXX` (first 8 of uuid, uppercased),
  *Just now*.
- Main: summary (22 px), optional location, the 3 required actions, and
  (if present) the caller's photo on the right.
- Bottom: 8-second countdown to auto-dismiss and two buttons
  (`ACKNOWLEDGE`, `VIEW FULL CASE`).

### Dept config

`constants/deptConfig.ts` maps each `Department` to:

```ts
{ label, color, bgDark, icon, menuItems: { label, path }[] }
```

| Dept | Color | Icon | Color meaning |
|---|---|---|---|
| `fire`    | `#ff6b35` | 🔥 | Orange |
| `medical` | `#00c896` | 🏥 | Teal |
| `police`  | `#3b82f6` | 🚔 | Blue |
| `defense` | `#ef4444` | 🛡️ | Red |

The dashboard's `--dept-color` CSS variable is set on `<html>` from the
logged-in org so the entire theme (sidebar top border, filter pill,
active nav link, case card border) recolors automatically.

### Setup

```bash
cd backend/dashboard
npm install
cp .env.example .env
npm run dev                # http://localhost:5173
```

Log in with any of the seeded orgs (e.g. `police-01` / `police2024!`).
The WS connects immediately; you can fire a synthetic alert with the
`curl` snippet in section 9.

---

## 7. Environment variables (full)

### `backend/backend/.env`

```env
PORT=3000
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-random-32-char-secret-here
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
AGENT_SECRET=internal-agent-shared-secret
```

### `backend/agent/.env`

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
BACKEND_ALERT_URL=http://localhost:3000/alert
AGENT_SECRET=internal-agent-shared-secret
```

### `backend/dashboard/.env`

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### `client/.env`

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

> When running the mobile app on a physical device, replace `localhost`
> with the LAN IP of the machine running the backend
> (e.g. `http://192.168.1.42:3000`).

---

## 8. End-to-end test without real LiveKit / Groq

The full LiveKit + Groq path is needed to exercise the agent and the
WebRTC round-trip, but the alert → dashboard path can be triggered
synthetically with `curl`:

```bash
# 1. log in
TOKEN=$(curl -s -X POST localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"orgId":"police-01","password":"police2024!"}' | jq -r .token)

# 2. open the dashboard at http://localhost:5173 (log in as police-01)

# 3. fire a synthetic alert
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

The dashboard tab opened in step 2 should immediately show the red
`AlertOverlay` with a countdown and audio beep. The case also lands on
`/incidents`, where you can mark it *Responding* or *Resolved*.

A complete Postman collection with the same payload is in
[`POSTMAN_COLLECTION.json`](./POSTMAN_COLLECTION.json).

---

## 9. Persistence — a known limitation

`caseStore` is an in-memory `Map` and is wiped on backend restart. This
is intentional for the prototype (no DB driver dep, no migrations). A
production deployment should swap `caseStore` for Postgres / Redis with
the same interface (`add / getById / getByDept / updateStatus`). The
HTTP and WS layers do not need to change.

JWTs are also stateless: the dashboard persists the token in
`localStorage` and re-validates with `GET /auth/me` on page load. A
restart of the backend does **not** invalidate live sessions until the
token's 8 h `exp` elapses.

---

## 10. Build order

```
Step 1: backend/backend/      npm install → npm run seed → npm run dev
Step 2: backend/agent/        pip install -r requirements.txt → python agent.py dev
Step 3: backend/dashboard/    npm install → npm run dev → log in
Step 4: client/               npm install → npx expo start  (or expo run:ios/android)
Step 5: Integration           call from client → ARIA talks → triage fires → dashboard alerts
```

The root `start.sh` runs steps 1 and 2 in parallel with output prefixing
(`[backend] …` / `[agent] …`). The dashboard and the client are run
separately in their own terminals.

---

## 11. Troubleshooting

- **Mobile can't reach the backend** — `EXPO_PUBLIC_BACKEND_URL` must be
  the LAN IP, not `localhost`, when testing on a physical device. Both
  machines must be on the same network.
- **WebRTC not working on Android** — confirm
  `@config-plugins/react-native-webrtc` is in the `plugins` array of
  `client/app.json`. Re-run `npx expo prebuild --clean` if you change it.
- **No audio on the dashboard alert** — browsers block `AudioContext`
  until first user interaction. Click anywhere on the login page first;
  subsequent beeps will play.
- **WS immediately disconnects** — the dashboard's WS handshake must
  carry a valid JWT. If you see `HTTP/1.1 401 Unauthorized` in the
  network tab, the token in `localStorage` has expired (8 h) or
  `JWT_SECRET` changed on the backend. Log out and back in.
- **Triage returns 400 from the agent** — usually means Groq returned a
  `department` / `severity` / `actions` that didn't match the enum; the
  exception is caught in `attempt_triage` and logged as
  `[TRIAGE ERROR] …`. Re-run with a clearer transcript.
- **`orgs.json not found`** — `npm run seed` inside `backend/backend/`
  generates it on first run.
- **Two operators see the same alert twice** — by design. Each
  dashboard tab is an independent WS connection, and the
  `AlertOverlay` queue is per-tab. Acknowledging on one tab does not
  affect another.

---

*ARIA — emergency response where seconds matter.*
