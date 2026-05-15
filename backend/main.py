"""
main.py  –  FastAPI backend for Chintu Dashboard
Provides:
  WS  /ws/emotion              – real-time emotion data stream (10 fps)
  GET /api/health              – health check
  POST /api/assistant/chat     – AI assistant chat response
  POST /api/assistant/command  – automation command execution
  POST /api/smarthome/control  – smart home device control
  GET /api/demo/*              – simulated demo data endpoints
"""

import asyncio
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from emotion_engine import engine
from demo_data import (
    generate_security_logs,
    generate_iot_feed,
    generate_system_stats,
    generate_emotion_history,
    generate_home_usage,
    get_random_notification,
    get_default_smart_home_state,
)
from assistant_engine import brain
from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    emotion: Optional[str] = None

class SmartHomeRequest(BaseModel):
    device_key: str
    state: bool

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Chintu Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup / Shutdown ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    engine.start()
    logger.info("Emotion engine started")


@app.on_event("shutdown")
async def shutdown():
    engine.stop()
    logger.info("Emotion engine stopped")


# ── WebSocket – Emotion Stream ────────────────────────────────────────────────
@app.websocket("/ws/emotion")
async def emotion_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info(f"WebSocket connected: {websocket.client}")
    try:
        while True:
            data = engine.get_latest()
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(0.1)   # 10 fps
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {websocket.client}")
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")


# ── REST Endpoints ────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Chintu Dashboard API"}


@app.get("/api/demo/security")
def demo_security(count: int = 15):
    return JSONResponse(content=generate_security_logs(count))


@app.get("/api/demo/iot")
def demo_iot(count: int = 12):
    return JSONResponse(content=generate_iot_feed(count))


@app.get("/api/demo/stats")
def demo_stats():
    return JSONResponse(content=generate_system_stats())


@app.get("/api/demo/emotion-history")
def demo_emotion_history():
    return JSONResponse(content=generate_emotion_history())


@app.get("/api/demo/home-usage")
def demo_home_usage():
    return JSONResponse(content=generate_home_usage())


@app.get("/api/demo/notification")
def demo_notification():
    return JSONResponse(content=get_random_notification())


@app.get("/api/demo/smart-home-state")
def demo_smart_home():
    return JSONResponse(content=get_default_smart_home_state())


# ── Assistant Endpoints ────────────────────────────────────────────────────────
@app.post("/api/assistant/chat")
def assistant_chat(req: ChatRequest):
    result = brain.process(req.message, req.emotion)
    return JSONResponse(content=result)


@app.post("/api/assistant/command")
def assistant_command(req: ChatRequest):
    result = brain.process(req.message, req.emotion)
    return JSONResponse(content=result)


@app.post("/api/smarthome/control")
def smarthome_control(req: SmartHomeRequest):
    brain.smart_home[req.device_key] = req.state
    from assistant_engine import smart_home_response
    msg = smart_home_response(req.device_key, req.state)
    return JSONResponse(content={"response": msg, "smart_home_state": brain.smart_home.copy()})


@app.get("/api/assistant/history")
def assistant_history():
    return JSONResponse(content=brain.get_history())


@app.delete("/api/assistant/reset")
def assistant_reset():
    brain.reset()
    return JSONResponse(content={"status": "session reset"})


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
