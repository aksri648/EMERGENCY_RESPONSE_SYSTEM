# ARIA Agent

Python LiveKit Agent worker. Joins rooms as `ARIA`, conducts the call (Groq LLM + LiveKit Cloud STT/TTS), and after 3 caller turns POSTs a triage result to the backend.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in real values
python agent.py dev
```

`dev` registers the worker with LiveKit Cloud and waits for room dispatch.

## Files

- `agent.py` — entrypoint; voice assistant + triage trigger
- `personality.py` — ARIA system prompt
- `triage.py` — Groq classifier returning `{ department, severity, summary, actions[3], callerLocation }`

## Triage flow

1. Agent joins room, says opening line
2. Tracks caller turns; on 3rd, runs `triage_transcript()`
3. POSTs to `BACKEND_ALERT_URL` with `X-Agent-Secret`
4. Tracks `alerted_rooms` to prevent duplicate alerts; re-allows on POST failure
