"""
server.py — FastAPI application for the Finova chatbot microservice.

Exposes:
  POST   /chat                  — Send a message, get a response
  DELETE /chat/{session_id}     — Clear session history
  GET    /health                — Health check

The Node.js backend proxies requests to this service (chatController.ts).
Session IDs default to the authenticated user's ID passed from the proxy.
"""

from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from db import init_pool, close_pool
from agent import build_agent

load_dotenv()

# ─── In-memory session store ──────────────────────────────────────────────────
# Maps session_id → Agno Agent instance
# For production, swap this for Redis or a DB-backed session store.
_sessions: dict[str, object] = {}


def get_or_create_agent(session_id: str):
    """Return an existing agent for the session, or create a new one."""
    if session_id not in _sessions:
        _sessions[session_id] = build_agent(session_id)
    return _sessions[session_id]


# ─── Application Lifecycle ────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB pool on startup; close it on shutdown."""
    await init_pool()
    yield
    await close_pool()
    _sessions.clear()


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Finova AI Chatbot",
    description="Financial assistant microservice for Finova admins — powered by Agno + OpenAI.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Simple liveness probe used by the Node.js backend before forwarding."""
    return {"status": "ok", "service": "finova-chatbot"}


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Send a message to the Nova financial assistant.

    The session_id should be the authenticated user's ID (forwarded from the
    Node.js proxy). This keeps each admin's conversation history separate.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="`message` must be a non-empty string.")

    session_id = request.session_id or "default"
    agent = get_or_create_agent(session_id)

    # Inject today's date into the message so the agent can resolve relative dates
    today_str = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
    enriched_message = f"[Today's date: {today_str}]\n{request.message.strip()}"

    try:
        run_response = await asyncio.to_thread(agent.run, enriched_message)
        response_text = run_response.content if run_response.content else "I'm sorry, I could not generate a response."
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Agent error: {str(exc)}"
        )

    return ChatResponse(
        response=response_text,
        session_id=session_id,
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
    )


@app.delete("/chat/{session_id}", tags=["Chat"])
async def clear_session(session_id: str):
    """
    Clear the conversation history for a specific session.
    Called by the Node.js proxy when the user resets their chat.
    """
    if session_id in _sessions:
        del _sessions[session_id]
        return {"message": f"Session '{session_id}' cleared successfully."}
    return {"message": f"Session '{session_id}' not found (already cleared or never started)."}


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("CHATBOT_PORT", "8000"))
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
