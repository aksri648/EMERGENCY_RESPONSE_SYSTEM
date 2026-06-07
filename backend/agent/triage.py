import json
import os
from groq import Groq

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


TRIAGE_SYSTEM = """
You are an emergency triage classifier. Analyze a conversation transcript between an AI agent and a distressed civilian.

Determine:
1. department - exactly one of:
   "police"  -> crime, assault, theft, threat, domestic violence, kidnapping, suspicious activity
   "medical" -> injury, illness, overdose, cardiac arrest, choking, unconscious person, childbirth
   "fire"    -> fire, explosion, gas leak, smoke, building collapse, chemical spill
   "defense" -> terrorism, mass casualty, civil unrest, biological/chemical threat, hostage

2. severity - exactly one of:
   "critical" -> life is at immediate risk right now
   "high"     -> serious injury/threat, minutes matter
   "medium"   -> urgent but caller is currently stable

3. summary - one sentence (max 15 words) describing the emergency for dispatchers

4. actions - array of exactly 3 specific action items for the RESPONDING DEPARTMENT (not the caller)

5. callerLocation - extract verbatim if mentioned, else null

Respond ONLY with valid compact JSON. No markdown. No explanation. No extra keys.
{"department":"...","severity":"...","summary":"...","actions":["...","...","..."],"callerLocation":"..."}
""".strip()


def triage_transcript(transcript: str) -> dict:
    resp = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": TRIAGE_SYSTEM},
            {"role": "user", "content": f"TRANSCRIPT:\n{transcript}"},
        ],
        temperature=0.1,
        max_tokens=512,
    )
    raw = (resp.choices[0].message.content or "").strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    result = json.loads(raw)

    if result.get("department") not in {"police", "medical", "fire", "defense"}:
        raise ValueError(f"Invalid department: {result.get('department')}")
    if result.get("severity") not in {"critical", "high", "medium"}:
        raise ValueError(f"Invalid severity: {result.get('severity')}")
    if not isinstance(result.get("actions"), list) or len(result["actions"]) == 0:
        raise ValueError("actions must be non-empty list")
    return result
