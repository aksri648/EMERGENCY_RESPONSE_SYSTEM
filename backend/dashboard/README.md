# ARIA Dashboard

React + Vite dashboard with role-based org login. Each org sees only their department's cases.

## Setup

```bash
npm install
cp .env.example .env       # optional; defaults point at localhost:3000
npm run dev                # http://localhost:5173
```

## Seeded credentials

| Department | Org ID | Password |
|---|---|---|
| Fire    | `fire-dept-01` | `fire2024!` |
| Medical | `medical-01` | `med2024!` |
| Police  | `police-01` | `police2024!` |
| Defense | `defense-01` | `defense2024!` |

## Key feature: Alert Overlay

Every `NEW_CASE` WebSocket message triggers a full-screen red overlay with:
- Flashing "🚨 EMERGENCY ALERT 🚨" header
- Severity badge (CRITICAL pulses), ticket ID, summary, location, actions, photo
- ACKNOWLEDGE / VIEW FULL CASE buttons
- 8-second auto-dismiss countdown
- Audio beep (1× for medium, 2× for high, 3× for critical) via Web Audio API
- Queue-based: CRITICAL cases jump to the front

## Files

- `src/components/AlertOverlay.tsx` — the red notification
- `src/hooks/useWebSocket.ts` — connection + queue + status updates
- `src/constants/deptConfig.ts` — per-department color, icon, menu
