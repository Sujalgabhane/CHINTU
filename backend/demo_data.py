"""
demo_data.py  –  Simulated IoT, Security, and Smart Home data generators
All data here is DEMO only – used for presentation/prototype purposes.
"""

import random
import time
import math
from datetime import datetime, timedelta


# ── Security / Surveillance Logs ─────────────────────────────────────────────
SECURITY_EVENTS = [
    {"type": "motion",    "icon": "🔵", "severity": "low",    "message": "Motion detected – Front Garden"},
    {"type": "motion",    "icon": "🔵", "severity": "low",    "message": "Motion sensor triggered – Hallway"},
    {"type": "alert",     "icon": "🟡", "severity": "medium", "message": "Unknown face detected at main entrance"},
    {"type": "alert",     "icon": "🟡", "severity": "medium", "message": "Perimeter breach – East boundary"},
    {"type": "intrusion", "icon": "🔴", "severity": "high",   "message": "INTRUDER ALERT – Back door"},
    {"type": "intrusion", "icon": "🔴", "severity": "high",   "message": "Unauthorized vehicle in driveway"},
    {"type": "info",      "icon": "⚪", "severity": "low",    "message": "Scheduled surveillance scan complete"},
    {"type": "info",      "icon": "⚪", "severity": "low",    "message": "Camera calibration auto-adjusted"},
    {"type": "alert",     "icon": "🟡", "severity": "medium", "message": "Package detected at front door"},
    {"type": "motion",    "icon": "🔵", "severity": "low",    "message": "Pet activity – Living room camera"},
    {"type": "info",      "icon": "⚪", "severity": "low",    "message": "All systems nominal – Nightly check"},
    {"type": "alert",     "icon": "🟡", "severity": "medium", "message": "Doorbell pressed – Visitor identified"},
]

def generate_security_logs(count: int = 15) -> list:
    logs = []
    now  = datetime.now()
    for i in range(count):
        evt = random.choice(SECURITY_EVENTS).copy()
        ts  = now - timedelta(minutes=random.randint(0, 120))
        evt["id"]        = f"SEC-{random.randint(1000, 9999)}"
        evt["timestamp"] = ts.strftime("%H:%M:%S")
        evt["camera"]    = random.choice(["CAM-01", "CAM-02", "CAM-03", "CAM-04", "CAM-05"])
        logs.append(evt)
    return sorted(logs, key=lambda x: x["timestamp"], reverse=True)


# ── IoT Activity Feed ─────────────────────────────────────────────────────────
IOT_EVENTS = [
    "Smart light adjusted to warm white – Bedroom",
    "AC temperature set to 22°C automatically",
    "Front door unlocked for 10 seconds – Scheduled",
    "Microwave completed cooking cycle",
    "Smart plug activated – Coffee maker",
    "Washing machine cycle complete",
    "Motion sensor armed – Night mode",
    "Smart TV powered off – Auto sleep",
    "Water heater temperature balanced",
    "Security camera pan-tilt adjusted",
    "Smart fan speed increased – Humidity spike",
    "Living room lights dimmed – Movie mode",
    "Fridge temperature alert – Door left open",
    "Smart speaker volume reduced – Night quiet hours",
    "Garden sprinkler activated – Scheduled watering",
    "Curtains auto-closed – Sunset trigger",
    "Robot vacuum docking complete",
    "Smart lock PIN changed – Admin action",
]

def generate_iot_feed(count: int = 12) -> list:
    feed = []
    now  = datetime.now()
    base = int(now.timestamp() * 1000)   # ms timestamp – guarantees unique IDs
    for i in range(count):
        ts = now - timedelta(minutes=random.randint(0, 180))
        feed.append({
            "id":        f"IOT-{base}-{i}",
            "message":   random.choice(IOT_EVENTS),
            "timestamp": ts.strftime("%H:%M"),
            "device":    random.choice(["SmartLight", "AC", "Lock", "Sensor", "Camera", "Appliance"]),
            "status":    random.choice(["completed", "active", "warning"]),
        })
    return sorted(feed, key=lambda x: x["timestamp"], reverse=True)


# ── System Stats ─────────────────────────────────────────────────────────────
def generate_system_stats() -> dict:
    t = time.time()
    cpu     = 35 + 30 * abs(math.sin(t / 20)) + random.uniform(-5, 5)
    memory  = 58 + 15 * abs(math.sin(t / 35)) + random.uniform(-3, 3)
    battery = max(20, 90 - (t % 3600) / 3600 * 40 + random.uniform(-2, 2))
    temp    = 42 + 18 * abs(math.sin(t / 15)) + random.uniform(-3, 3)
    return {
        "cpu":        round(min(99, max(1, cpu)), 1),
        "memory":     round(min(99, max(10, memory)), 1),
        "battery":    round(min(100, max(5, battery)), 1),
        "temperature":round(min(85, max(30, temp)), 1),
        "network_up": round(random.uniform(0.5, 8.5), 2),
        "network_dn": round(random.uniform(1.0, 25.0), 2),
        "uptime_hrs": round((t % 86400) / 3600, 1),
        "gpu_usage":  round(random.uniform(5, 75), 1),
        "disk_usage": round(random.uniform(45, 70), 1),
    }


# ── Emotion History (7-day trend) ─────────────────────────────────────────────
EMOTIONS = ["Angry", "Confused", "Excited", "Fear", "Happiness", "Sadness", "Surprised", "Thoughtful"]

def generate_emotion_history() -> list:
    now  = datetime.now()
    data = []
    for day in range(6, -1, -1):
        dt = now - timedelta(days=day)
        entry = {"day": dt.strftime("%a")}
        total = 0
        vals  = {}
        for em in EMOTIONS:
            v = max(0, int(random.gauss(10, 8)))
            vals[em] = v
            total   += v
        # Normalise to percentages
        for em in EMOTIONS:
            entry[em] = round(vals[em] / max(total, 1) * 100, 1)
        data.append(entry)
    return data


# ── Hourly Smart Home Usage ───────────────────────────────────────────────────
def generate_home_usage() -> list:
    data = []
    for hour in range(24):
        # Realistic usage patterns
        if 6 <= hour <= 8:    base = 75  # morning
        elif 12 <= hour <= 13: base = 55 # lunch
        elif 18 <= hour <= 22: base = 85  # evening peak
        elif 0 <= hour <= 5:  base = 10   # night low
        else:                 base = 35
        data.append({
            "hour":   f"{hour:02d}:00",
            "lights": min(100, max(0, base + random.randint(-15, 15))),
            "ac":     min(100, max(0, base * 0.8 + random.randint(-10, 10))),
            "media":  min(100, max(0, base * 0.6 + random.randint(-20, 20))),
        })
    return data


# ── Notifications ─────────────────────────────────────────────────────────────
NOTIFICATIONS = [
    {"type": "alert",   "title": "Security Alert",      "body": "Motion detected at back entrance"},
    {"type": "info",    "title": "Emotion Update",       "body": "Happiness detected – comfort mode on"},
    {"type": "success", "title": "Automation Complete",  "body": "Evening routine executed successfully"},
    {"type": "warning", "title": "Battery Low",          "body": "Chintu robot battery at 23%"},
    {"type": "info",    "title": "AI Learning",          "body": "Model improved from today's sessions"},
    {"type": "alert",   "title": "Temperature Alert",    "body": "Living room temp above threshold"},
    {"type": "success", "title": "System Update",        "body": "All sensors calibrated successfully"},
    {"type": "info",    "title": "Scheduled Task",       "body": "Garden sprinklers activated"},
    {"type": "warning", "title": "Network Latency",      "body": "WebSocket latency slightly elevated"},
]

def get_random_notification() -> dict:
    n = random.choice(NOTIFICATIONS).copy()
    n["id"]  = f"NOTIF-{random.randint(1000, 9999)}"
    n["time"]= datetime.now().strftime("%H:%M:%S")
    return n


# ── Smart Home Default State ──────────────────────────────────────────────────
def get_default_smart_home_state() -> dict:
    return {
        "livingRoomLight": True,
        "bedroomLight":    False,
        "kitchenLight":    True,
        "gardenLight":     False,
        "fanSpeed":        3,
        "doorLocked":      True,
        "alarmArmed":      False,
        "acTemp":          22,
        "acOn":            True,
        "tvOn":            False,
        "curtainsClosed":  False,
        "sprinklers":      False,
    }
