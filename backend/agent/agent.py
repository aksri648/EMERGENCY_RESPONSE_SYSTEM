import asyncio
import os

import httpx
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    ConversationItemAddedEvent,
    JobContext,
    JobProcess,
    cli,
)
from livekit.agents.llm import ChatMessage
from livekit.plugins import groq, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from personality import ARIA_SYSTEM_PROMPT
from triage import triage_transcript

load_dotenv()

BACKEND_ALERT_URL = os.environ["BACKEND_ALERT_URL"]
AGENT_SECRET = os.environ["AGENT_SECRET"]

alerted_rooms: set[str] = set()


class AriaAgent(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=ARIA_SYSTEM_PROMPT)


server = AgentServer()


def prewarm(proc: JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="aria")
async def entrypoint(ctx: JobContext) -> None:
    ctx.log_context_fields = {"room": ctx.room.name}

    session = AgentSession(
        stt=groq.STT(model="whisper-large-v3-turbo", language="en"),
        llm=groq.LLM(model="llama-3.3-70b-versatile"),
        tts=groq.TTS(model="canopylabs/orpheus-v1-english", voice="autumn"),
        vad=ctx.proc.userdata["vad"],
        turn_detection=MultilingualModel(),
        allow_interruptions=True,
    )

    transcript_parts: list[str] = []
    caller_turns = 0

    @session.on("conversation_item_added")
    def on_conversation_item(event: ConversationItemAddedEvent) -> None:
        nonlocal caller_turns
        if not isinstance(event.item, ChatMessage):
            return
        text = event.item.text_content
        if not text:
            return
        if event.item.role == "user":
            transcript_parts.append(f"Caller: {text}")
            caller_turns += 1
            if caller_turns >= 3:
                asyncio.create_task(attempt_triage(ctx, list(transcript_parts)))
        elif event.item.role == "assistant":
            transcript_parts.append(f"ARIA: {text}")

    await session.start(agent=AriaAgent(), room=ctx.room)
    await ctx.connect()

    await session.say(
        "I'm here with you. You're safe to talk. What's happening right now?",
        allow_interruptions=True,
    )


async def attempt_triage(ctx: JobContext, transcript: list[str]) -> None:
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

    photo_url = None
    if ctx.room.metadata and ctx.room.metadata.startswith("http"):
        photo_url = ctx.room.metadata

    payload = {
        **result,
        "photoUrl": photo_url,
        "transcript": full_transcript,
        "roomName": room_name,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                BACKEND_ALERT_URL,
                json=payload,
                headers={"X-Agent-Secret": AGENT_SECRET},
                timeout=8.0,
            )
            print(
                f"[ALERT] {resp.status_code} dept={result['department']} "
                f"severity={result['severity']}"
            )
    except Exception as e:
        print(f"[ALERT ERROR] {e}")
        alerted_rooms.discard(room_name)


if __name__ == "__main__":
    cli.run_app(server)
