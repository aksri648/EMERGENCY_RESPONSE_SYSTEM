# Memory — ARIA Emergency Response Project

## Goal
- Analyze the ARIA Emergency Response codebase, add a big red EMERGENCY button with dialer icon, clean dead code, reorganize into `client/` and `backend/` folders, produce accurate project documentation, and provide a one-shot bootstrap (script + setup checklist) for first-time local run.

## Constraints & Preferences
- Keep changes minimal and avoid breaking the running app
- Preserve git/history of moved code where possible
- Don't remove code unless verified unused via `grep`/file scan
- Match the new `client/` + `backend/` directory structure in all docs
- Use `replaceAll` only for unambiguous path substitutions
- All-in-one scripts should support single Ctrl+C cleanup of all child processes
- Color-coded log prefixes per service preferred for visual distinction

## Progress
### Done
- Added big red EMERGENCY button (220×220 circular, `phone-classic` icon, 2 pulse rings) to `client/app/(start)/index.tsx`
- Cleaned: deleted `constants/Colors.ts`, `hooks/useColorScheme.ts`, `hooks/useColorScheme.web.ts`, `hooks/useThemeColor.ts`, `taskfile.yaml`, `project-setup.md`, 20 unused PNG assets, dead `Stack.Screen name="assistant"` and `MICROPHONE_TRACK` export + `Track` import
- Reorganized: moved `agent-starter-react-native/*` → `client/`, `server/*` → `backend/`; updated `start.sh` and `README.md`
- Removed unused `medguardian/` folder
- Updated `MASTER_PROMPT.md`, `prompt(1).md`, `project-documentation.md` path references (`server/` → `backend/`, `agent-starter` → `client/`)
- Rewrote `project-documentation.md` (712 lines) accurately describing the real ARIA architecture across all 4 modules
- Created `start-all.sh` (executable, syntax-checked): parallel-launches backend + agent + dashboard + Expo Metro with color-coded prefixes (cyan/yellow/green/magenta), pre-flight checks for `node`/`npm`/`python` + `node_modules/` per service + missing `.env` warnings, single Ctrl+C cleanup (SIGTERM → 1s wait → SIGKILL)
- Provided first-time setup checklist: LiveKit Cloud + Groq + Cloudinary account creation, local `npm install` (3 Node trees) + `python -m venv` (agent), `cp .env.example .env` for all 4 services, `npm run seed`, `./start-all.sh` boot, `curl /health` sanity check, optional `npx expo run:ios|android` for native shell

### In Progress
- (none — awaiting user action to perform setup)

### Blocked
- (none)

## Key Decisions
- Reorg: kept inner `backend/backend/` name (Node API) rather than renaming to `api/`, to minimize disruption
- Pre-existing TS errors in `client/app/call/index.tsx` and `client/app/upload/index.tsx` (uuid types, expo-image-picker) left as-is — unrelated to changes
- Did not touch `client/.git/` internals (contains stale `agent-starter-react-native` refs from original LiveKit starter clone) — not a folder, not removable
- Kept `dashboard/` menu items pointing to `PlaceholderPage` (units/map/intake/hospitals/profiles/resources/protocols) — these are intentionally per-dept menu stubs
- `start-all.sh` mirrors existing `start.sh` style (same trap pattern, same `jobs -p | xargs -r kill` cleanup) and adds SIGKILL escalation + per-service `node_modules`/`*.env` checks
- Original `./start.sh` retained for users who want backend+agent only (quieter dev loop without Expo CLI noise)
- For physical-device mobile testing, `EXPO_PUBLIC_BACKEND_URL` must be machine's LAN IP, not `localhost` (e.g. `http://192.168.1.42:3000`)
- Expo Metro is interactive — user presses `i`/`a` in parent terminal to open simulator; the all-in-one script accepts this UX trade-off
- Dashboard alert flow + `POST /alert` path can be exercised end-to-end with just Cloudinary (no LiveKit/Groq required) for quick validation

## Next Steps
- User creates LiveKit Cloud, Groq, and Cloudinary accounts and copies keys
- User runs `npm install` in 3 Node trees + `python -m venv .venv && pip install -r requirements.txt` in `backend/agent`
- User copies each `.env.example` to `.env` and fills keys (matching `AGENT_SECRET` between backend + agent)
- User runs `cd backend/backend && npm run seed`
- User runs `./start-all.sh` and verifies all 4 services boot
- (Optional) `npx expo run:ios|android` in `client/` for native shell with LiveKit WebRTC
- (Optional) `curl -X POST http://localhost:3000/alert` (synthetic) for dashboard alert validation

## Critical Context
- Pre-existing `tsc --noEmit` errors: 2 in `client/app/call/index.tsx` and `client/app/upload/index.tsx` (uuid `CommonJS` interop, `expo-image-picker` module shape)
- Pre-existing `expo lint` issues: all prettier formatting warnings (no eslint errors)
- `backend/backend/src/services/caseStore.ts` is in-memory `Map<id, EmergencyCase>` — lost on restart (intentional for prototype)
- Backend port 3000, dashboard port 5173, agent is a LiveKit worker (no port), Expo Metro port 8081
- AGENT_SECRET header is `X-Agent-Secret: internal-agent-shared-secret` (must match between `backend/backend/.env` and `backend/agent/.env`)
- `AlertOverlay` has 8s auto-dismiss, `z-index: 9999`, 1/2/3 beeps for medium/high/critical
- `useWebSocket` reconnect: exponential backoff 1s→30s, doubles on each disconnect, resets on clean `onopen`
- `alerted_rooms: set[str]` in `backend/agent/agent.py` prevents duplicate alerts per LiveKit room
- Triage fires after `caller_turns >= 3` via `asyncio.create_task` (non-blocking)
- Hold-to-hangup: `HOLD_TO_END_MS = 2000` in `client/app/call/index.tsx`
- Caller identity uses `uuid v4` as `caller-<uuid>` (no PII)
- Dashboard WS: `ws://<host>/ws?token=<jwt>`; rejects in `upgrade` handler with `HTTP/1.1 401` on bad token
- Audio session: `@livekit/react-native` `AudioSession.startAudioSession()` / `stopAudioSession()` wraps the call lifecycle
- CTA icon: `MaterialCommunityIcons` `phone-classic` from `@expo/vector-icons`
- External services required: LiveKit Cloud (WebRTC + agent worker), Groq (`llama-3.3-70b-versatile` for triage+conversation), Cloudinary (photo uploads to folder `emergency-cases`)
- LLM classifier uses Groq strict-JSON mode (temp 0.1, max_tokens 512) in `backend/agent/triage.py`
- `start-all.sh` log prefixes: `[backend]` cyan, `[agent]` yellow, `[dashboard]` green, `[client]` magenta (ANSI escape codes)

## Relevant Files
- `/home/akshat/Projects/emergency_response/client/app/(start)/index.tsx`: Landing screen with big red EMERGENCY button + pulse rings
- `/home/akshat/Projects/emergency_response/client/app/call/index.tsx`: Call screen with VoiceOrb, StatusBanner, hold-to-hangup, LiveKit connect
- `/home/akshat/Projects/emergency_response/client/app/upload/index.tsx`: Pre-call photo capture & upload
- `/home/akshat/Projects/emergency_response/client/hooks/useLiveKitRoom.ts`: LiveKit Room wrapper, audio polling, ALERT_SENT listener
- `/home/akshat/Projects/emergency_response/client/components/VoiceOrb.tsx`: 4-state animated orb (connecting/agent/user/silent)
- `/home/akshat/Projects/emergency_response/client/components/StatusBanner.tsx`: Call state text component
- `/home/akshat/Projects/emergency_response/client/services/api.ts`: `getToken` + `uploadPhoto` helpers
- `/home/akshat/Projects/emergency_response/client/constants/theme.ts`: Dark + red emergency palette
- `/home/akshat/Projects/emergency_response/client/app.json`: Expo config with permissions, plugins, icons
- `/home/akshat/Projects/emergency_response/backend/backend/src/index.ts`: Express + WS server entry (port 3000)
- `/home/akshat/Projects/emergency_response/backend/backend/src/types.ts`: Department/Severity/CaseStatus enums + EmergencyCase shape
- `/home/akshat/Projects/emergency_response/backend/backend/src/routes/alert.ts`: `POST /alert` (X-Agent-Secret), creates case + broadcasts + sendRoomData
- `/home/akshat/Projects/emergency_response/backend/backend/src/routes/auth.ts`: `POST /auth/login` bcrypt + JWT 8h, `GET /auth/me`
- `/home/akshat/Projects/emergency_response/backend/backend/src/routes/cases.ts`: `GET /cases` dept-filtered, `PATCH /cases/:id/status` dept-checked
- `/home/akshat/Projects/emergency_response/backend/backend/src/routes/token.ts`: LiveKit AccessToken generation, 2h TTL
- `/home/akshat/Projects/emergency_response/backend/backend/src/routes/upload.ts`: Multer 10MB image-only, streams to Cloudinary
- `/home/akshat/Projects/emergency_response/backend/backend/src/middleware/auth.ts`: JWT bearer verification
- `/home/akshat/Projects/emergency_response/backend/backend/src/services/caseStore.ts`: In-memory case store
- `/home/akshat/Projects/emergency_response/backend/backend/src/services/ws.ts`: WSS init, dept-filtered broadcast, 25s server PING
- `/home/akshat/Projects/emergency_response/backend/backend/src/services/livekit.ts`: AccessToken + RoomServiceClient helpers
- `/home/akshat/Projects/emergency_response/backend/backend/src/services/cloudinary.ts`: Image upload to `emergency-cases` folder
- `/home/akshat/Projects/emergency_response/backend/backend/seed.ts`: Writes 4 bcrypt-hashed orgs to `src/data/orgs.json`
- `/home/akshat/Projects/emergency_response/backend/agent/agent.py`: VoiceAssistant entrypoint, triage trigger at caller_turns≥3, 10min self-termination
- `/home/akshat/Projects/emergency_response/backend/agent/personality.py`: `ARIA_SYSTEM_PROMPT` (empathetic/practical/brave/focused)
- `/home/akshat/Projects/emergency_response/backend/agent/triage.py`: Groq strict-JSON classifier (temp 0.1, max_tokens 512)
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/App.tsx`: Router with AuthProvider, PrivateRoute, OverlayHost
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/pages/Login.tsx`: Org login form
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/pages/Incidents.tsx`: Live case feed with severity filter
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/pages/History.tsx`: Resolved cases sorted by updatedAt
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/pages/PlaceholderPage.tsx`: Generic stub for units/map/intake/etc.
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/components/AlertOverlay.tsx`: Full-screen red alert, 8s auto-dismiss
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/components/CaseCard.tsx`: Per-case list card with severity color
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/components/CaseDetail.tsx`: Full case modal with transcript + photo
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/components/Sidebar.tsx`: Dept-themed nav with active/responding/resolved counts
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/context/AuthContext.tsx`: JWT in localStorage + `/auth/me` revalidation
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/context/CasesContext.tsx`: Wraps useWebSocket
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/hooks/useWebSocket.ts`: WS lifecycle, alert queue (critical→front), backoff reconnect
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/hooks/audio.ts`: 880Hz square-wave beep (1/2/3 by severity)
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/constants/deptConfig.ts`: Per-dept color/icon/menu
- `/home/akshat/Projects/emergency_response/backend/dashboard/src/styles.css`: Hand-written CSS with `--dept-color` runtime swap
- `/home/akshat/Projects/emergency_response/README.md`: Quick-start with new paths
- `/home/akshat/Projects/emergency_response/start.sh`: Runs backend + agent in parallel (original, preserved)
- `/home/akshat/Projects/emergency_response/start-all.sh`: Runs backend + agent + dashboard + Expo Metro in parallel; color-coded log prefixes; pre-flight checks (`node`/`npm`/`python` + `node_modules/` + `.env`); SIGTERM→SIGKILL escalation; single Ctrl+C cleanup
- `/home/akshat/Projects/emergency_response/MASTER_PROMPT.md`: Build spec (paths updated to `backend/`)
- `/home/akshat/Projects/emergency_response/prompt(1).md`: Conversation log (paths updated)
- `/home/akshat/Projects/emergency_response/project-documentation.md`: Fully rewritten (712 lines) to match real codebase
- `/home/akshat/Projects/emergency_response/POSTMAN_COLLECTION.json`: All backend routes with example payloads
- `/home/akshat/Projects/emergency_response/backend/agent/.env.example`: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GROQ_API_KEY`, `BACKEND_ALERT_URL`, `AGENT_SECRET`
- `/home/akshat/Projects/emergency_response/backend/backend/.env.example`: `PORT=3000`, `LIVEKIT_*`, `JWT_SECRET`, `CLOUDINARY_*`, `AGENT_SECRET`
- `/home/akshat/Projects/emergency_response/backend/dashboard/.env.example`: `VITE_BACKEND_URL`, `VITE_WS_URL`
- `/home/akshat/Projects/emergency_response/client/.env.example`: `EXPO_PUBLIC_BACKEND_URL`

---

## Session 2026-06-07 — Dependency repair, env setup, run instructions

### Dependency fixes (agent)

`backend/agent/requirements.txt` had unresolvable pins:
- `livekit-plugins-openai==0.8.6` — PyPI jumps 0.8.5 → 0.10.0; 0.8.6 never existed
- `livekit-plugins-livekit==0.1.0` — hallucinated package; doesn't exist on PyPI at any version

Migrated to current LiveKit Agents 1.5.x stack:
```
livekit-agents[groq,silero,turn-detector]==1.5.17
groq==0.9.0
httpx==0.27.2
python-dotenv==1.0.1
```
(Dropped `livekit-plugins-noise-cancellation` — was unused; current options are Krisp BVC or ai-coustics.)

### Agent code rewrite (`backend/agent/agent.py`)

Migrated from `VoiceAssistant` (0.8.x) to `AgentSession`/`Agent` (1.5.x):
- `VoiceAssistant` → `AgentSession` + `AriaAgent(Agent)` subclass
- `WorkerOptions(entrypoint_fnc=...)` → `AgentServer()` + `@server.rtc_session(agent_name="aria")`
- `prewarm_fnc=...` → `server.setup_fnc = prewarm`
- Groq-via-OpenAI-base_url hack → dedicated `livekit-plugins-groq` plugin
- `user_speech_committed`/`agent_speech_committed` events → single `conversation_item_added` event with `ChatMessage` items
- Added `MultilingualModel()` turn detector via `livekit.plugins.turn_detector.multilingual`

### Groq model gotcha

Docs page for `livekit-plugins-groq` listed `playai-tts` as TTS default. Wrong — Groq deprecated PlayAI TTS. Actual plugin v1.5.17 default is `canopylabs/orpheus-v1-english` with voice `autumn`. Confirmed via `inspect.signature(groq.TTS.__init__)` and against the live `/v1/models` endpoint on the user's account.

Models verified available on user's Groq key:
- LLM: `llama-3.3-70b-versatile`
- STT: `whisper-large-v3-turbo`
- TTS: `canopylabs/orpheus-v1-english`

### Default org accounts (already seeded)

`backend/backend/src/data/orgs.json` already has all four department logins, bcrypt-verified working:

| Department | orgId | Password |
|---|---|---|
| Police | `police-01` | `police2024!` |
| Hospital (Medical) | `medical-01` | `med2024!` |
| Fire | `fire-dept-01` | `fire2024!` |
| Defense | `defense-01` | `defense2024!` |

Regenerate via `npm run seed` in `backend/backend/` after editing `seed.ts`.

### Env vars — all populated and verified

**`backend/backend/.env`** (Express):
- `LIVEKIT_URL=wss://my-project-88ard0xm.livekit.cloud`

- `BACKEND_ALERT_URL=http://localhost:3000/alert`

**`backend/dashboard/.env`**:
- `VITE_BACKEND_URL=http://localhost:3000`
- `VITE_WS_URL=ws://localhost:3000`

**`client/.env`**:
- `EXPO_PUBLIC_BACKEND_URL=http://192.168.1.25:3000` (machine's LAN IP on `wlo1`; Expo on a phone can't hit `localhost`)

End-to-end verified:
- LiveKit credentials sign a JWT successfully
- Groq `/v1/models` returns HTTP 200, 16 models, target three all present
- Cloudinary upload + destroy round-trip succeeded

### How to run

One-time (agent model files):
```
cd backend/agent && .venv/bin/python agent.py download-files
```

Activate Python venv (when working on agent):
```
source /home/akshat/Projects/emergency_response/backend/agent/.venv/bin/activate
```

Start everything:
```
./start-all.sh
```
Ctrl+C stops all four. Endpoints: backend `:3000`, dashboard `:5173`, client via Expo QR, agent connects to LiveKit Cloud.
