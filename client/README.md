# ARIA Client (React Native)

Built on the LiveKit React Native starter template. The existing LiveKit room connection logic is preserved in `hooks/useLiveKitRoom.ts`; everything else has been replaced with the ARIA emergency call flow.

## Setup

```bash
npm install
cp .env.example .env       # point EXPO_PUBLIC_BACKEND_URL at your backend
npx expo start
```

Open in iOS simulator (`i`), Android emulator (`a`), or scan with Expo Go.

> Native modules are required (LiveKit + WebRTC + camera) — you will need to run a custom dev client (`npx expo run:ios` / `run:android`) the first time.

## Screens

| Path | Purpose |
|---|---|
| `app/(start)/index.tsx` | Landing — single big red CTA "START EMERGENCY CALL" |
| `app/upload/index.tsx`  | Optional photo capture & upload before the call |
| `app/call/index.tsx`    | Active LiveKit call — VoiceOrb, StatusBanner, hold-to-hangup |

## Components

- `components/VoiceOrb.tsx` — animated pulse orb (connecting / agent / user / silent)
- `components/StatusBanner.tsx` — call state text
- `components/PhotoPreview.tsx` — thumbnail of the uploaded photo

## Hook

`hooks/useLiveKitRoom.ts` — wraps the LiveKit `Room` instance:
- Connects with the provided wsUrl + token
- Enables the microphone immediately
- Polls audio levels every 100 ms for VoiceOrb feedback
- Listens for `RoomEvent.DataReceived`; when the backend posts `{ type: 'ALERT_SENT', department }`, status flips to `alerted` and StatusBanner updates

## Hold-to-hangup

The end-call button in `app/call/index.tsx` requires a 2-second press hold. A progress fill animates across the button while held; releasing early cancels.
