"""
emotion_engine.py  –  Background webcam inference thread for Chintu Dashboard
Loads the trained EmotionNet (MobileNetV2) model and runs real-time prediction.
Produces JSON-serialisable result dicts that FastAPI's WebSocket can forward.
"""

import os
import sys
import time
import base64
import threading
import logging
import numpy as np
import cv2

import torch
import torch.nn.functional as F

# ── Logger ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("emotion_engine")

# ── Constants ────────────────────────────────────────────────────────────────
EMOTIONS = sorted(["Angry", "Confused", "Excited", "Fear", "Happiness",
                   "Sadness", "Surprised", "Thoughtful"])
NUM_CLASSES = len(EMOTIONS)
IMG_SIZE = (224, 224)

EMOTION_COLORS_HEX = {
    "Angry":     "#ff4444",
    "Confused":  "#ff9500",
    "Excited":   "#ffd700",
    "Fear":      "#cc44ff",
    "Happiness": "#00e676",
    "Sadness":   "#0099ff",
    "Surprised": "#00e5ff",
    "Thoughtful":"#aaaaff",
}

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "emotion_model.pth")
DEVICE     = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── Model Architecture (copy of EmotionNet from train_model.py) ───────────────
import torch.nn as nn
from torchvision import models as tv_models

class EmotionNet(nn.Module):
    def __init__(self, num_classes=NUM_CLASSES, dropout=0.4):
        super().__init__()
        backbone = tv_models.mobilenet_v2(weights=None)
        self.features = backbone.features
        in_features = backbone.classifier[-1].in_features
        self.head = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.BatchNorm1d(in_features),
            nn.Dropout(dropout),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(dropout / 2),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.head(self.features(x))


# ── Preprocessing ─────────────────────────────────────────────────────────────
from torchvision import transforms as T

_transform = T.Compose([
    T.ToPILImage(),
    T.Resize(IMG_SIZE),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def preprocess_face(face_bgr: np.ndarray) -> torch.Tensor:
    face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    return _transform(face_rgb).unsqueeze(0)


# ── Moving Average Smoother ───────────────────────────────────────────────────
from collections import deque

class MovingAverage:
    """Wider window (20 frames) smooths out per-frame probability spikes."""
    def __init__(self, window=20):
        self.buf = deque(maxlen=window)

    def update(self, probs: np.ndarray) -> np.ndarray:
        self.buf.append(probs)
        return np.mean(self.buf, axis=0)


# ── Emotion Stabilizer ────────────────────────────────────────────────────────
class EmotionStabilizer:
    """
    Prevents rapid emotion-label flickering by requiring an emotion to be
    the majority winner for at least `min_hold_frames` consecutive decisions
    before publishing it as the new stable emotion.

    Logic:
      1. Keep a rolling vote buffer of recent per-frame winners.
      2. The candidate is the majority emotion in that buffer.
      3. Track how long the current candidate has been dominant.
      4. Only update `stable_emotion` once the candidate has been
         dominant for >= min_hold_frames.
    """

    def __init__(self, vote_window: int = 20, min_hold_frames: int = 25):
        """
        vote_window     – how many recent frames to consider for majority vote
        min_hold_frames – frames the winner must hold before being published
                          (25 frames × 0.1 s/frame ≈ 2.5 s)
        """
        self.vote_buf        = deque(maxlen=vote_window)
        self.min_hold        = min_hold_frames
        self.candidate       = None   # emotion currently leading the vote
        self.candidate_count = 0      # consecutive frames it has been leading
        self.stable_emotion  = None   # last published stable emotion

    def update(self, raw_emotion: str) -> str:
        """Feed in the raw per-frame emotion; returns the stabilized emotion."""
        self.vote_buf.append(raw_emotion)

        # Majority vote across the buffer
        counts = {}
        for e in self.vote_buf:
            counts[e] = counts.get(e, 0) + 1
        leader = max(counts, key=counts.get)

        if leader == self.candidate:
            self.candidate_count += 1
        else:
            # New candidate – reset hold counter
            self.candidate       = leader
            self.candidate_count = 1

        # Publish only when the candidate has been dominant long enough
        if self.candidate_count >= self.min_hold:
            self.stable_emotion = self.candidate

        # Bootstrap: on first call, publish immediately
        if self.stable_emotion is None:
            self.stable_emotion = leader

        return self.stable_emotion


# ── Face Detector ─────────────────────────────────────────────────────────────
class FaceDetector:
    def __init__(self):
        cascade = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.cascade = cv2.CascadeClassifier(cascade)

    def detect(self, frame_bgr: np.ndarray) -> list:
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = self.cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=5, minSize=(60, 60)
        )
        return faces.tolist() if len(faces) > 0 else []


# ── Emotion Engine ────────────────────────────────────────────────────────────
class EmotionEngine:
    """
    Runs in a background thread.
    Captures webcam frames, detects faces, predicts emotion, and stores
    the latest result in `self.latest` for any number of WS subscribers.
    """

    def __init__(self, webcam_index: int = 0, target_fps: int = 10):
        self.target_fps   = target_fps
        self.webcam_index = webcam_index
        self._thread      = None
        self._stop_evt    = threading.Event()
        self.latest: dict = self._blank_result()
        self._lock        = threading.Lock()

        # Load model
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model not found at {MODEL_PATH}")
            logger.error("Please ensure emotion_model.pth is in backend/models/")
            self.model = None
        else:
            self.model = EmotionNet(num_classes=NUM_CLASSES)
            state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
            self.model.load_state_dict(state_dict)
            self.model.to(DEVICE)
            self.model.eval()
            logger.info(f"EmotionNet loaded on {DEVICE}")

        self.face_detector = FaceDetector()
        self.smoother      = MovingAverage(window=20)
        self.stabilizer    = EmotionStabilizer(vote_window=20, min_hold_frames=25)

    # ── helpers ──────────────────────────────────────────────────────────────
    @staticmethod
    def _blank_result() -> dict:
        return {
            "emotion":    "Scanning…",
            "confidence": 0.0,
            "probs":      {e: 0.0 for e in EMOTIONS},
            "has_face":   False,
            "faces":      [],
            "frame_b64":  "",
            "color":      "#00d4ff",
            "fps":        0.0,
        }

    def _encode_frame(self, frame: np.ndarray, quality: int = 60) -> str:
        """JPEG-encode and Base64-encode a BGR frame."""
        ret, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        if not ret:
            return ""
        return base64.b64encode(buf.tobytes()).decode("utf-8")

    def _draw_overlays(self, frame, faces, emotion, confidence, color_hex):
        """Draw bounding boxes and labels on frame."""
        # Convert hex color to BGR
        h = color_hex.lstrip("#")
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        bgr = (b, g, r)

        for (x, y, w, h_) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h_), bgr, 2)
            label = f"{emotion}  {confidence * 100:.1f}%"
            font  = cv2.FONT_HERSHEY_SIMPLEX
            (tw, th), _ = cv2.getTextSize(label, font, 0.65, 2)
            cv2.rectangle(frame, (x, y - th - 14), (x + tw + 8, y), (15, 15, 30), -1)
            cv2.putText(frame, label, (x + 4, y - 6), font, 0.65, bgr, 2, cv2.LINE_AA)

        # Mini branding strip
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 36), (10, 10, 25), -1)
        cv2.putText(frame, "CHINTU  |  AI Emotion Detection",
                    (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 212, 255), 2, cv2.LINE_AA)
        return frame

    # ── Main loop ─────────────────────────────────────────────────────────────
    def _run(self):
        cap = cv2.VideoCapture(self.webcam_index)
        if not cap.isOpened():
            logger.error("Cannot open webcam!")
            return

        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        logger.info("Webcam opened successfully")

        interval  = 1.0 / self.target_fps
        fps_timer = time.time()
        fps_count = 0
        fps_val   = 0.0

        while not self._stop_evt.is_set():
            t0 = time.time()
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            # FPS counter
            fps_count += 1
            elapsed = time.time() - fps_timer
            if elapsed >= 1.0:
                fps_val   = fps_count / elapsed
                fps_count = 0
                fps_timer = time.time()

            result = self._blank_result()
            result["fps"] = round(fps_val, 1)

            faces = self.face_detector.detect(frame)

            if faces and self.model is not None:
                x, y, w, h_ = faces[0]  # primary face
                margin = 20
                fH, fW = frame.shape[:2]
                fx1 = max(0, x - margin); fy1 = max(0, y - margin)
                fx2 = min(fW, x + w + margin); fy2 = min(fH, y + h_ + margin)
                face_crop = frame[fy1:fy2, fx1:fx2]

                if face_crop.size > 0:
                    try:
                        with torch.no_grad():
                            tensor = preprocess_face(face_crop).to(DEVICE)
                            logits = self.model(tensor)
                            raw_p  = F.softmax(logits, dim=1).cpu().numpy()[0]
                        smoothed     = self.smoother.update(raw_p)
                        raw_top_idx  = int(np.argmax(smoothed))
                        raw_emotion  = EMOTIONS[raw_top_idx]
                        raw_conf     = float(smoothed[raw_top_idx])

                        # Stabilize: only switch displayed emotion after
                        # consistent detection over ~2.5 s
                        stable_emotion = self.stabilizer.update(raw_emotion)

                        # Use smoothed probability for the stable label
                        stable_idx = EMOTIONS.index(stable_emotion)
                        confidence = float(smoothed[stable_idx])
                        probs_dict = {EMOTIONS[i]: round(float(smoothed[i]), 4)
                                      for i in range(NUM_CLASSES)}

                        result["has_face"]   = True
                        result["emotion"]    = stable_emotion
                        result["confidence"] = round(confidence, 4)
                        result["probs"]      = probs_dict
                        result["faces"]      = [[x, y, w, h_]]
                        result["color"]      = EMOTION_COLORS_HEX.get(stable_emotion, "#00d4ff")

                        frame = self._draw_overlays(frame, [[x, y, w, h_]],
                                                    stable_emotion, confidence,
                                                    result["color"])
                    except Exception as e:
                        logger.warning(f"Prediction error: {e}")
            else:
                # No face – still draw branding
                frame = self._draw_overlays(frame, [], "No Face", 0.0, "#00d4ff")

            result["frame_b64"] = self._encode_frame(frame)

            with self._lock:
                self.latest = result

            # Throttle to target_fps
            sleep_t = interval - (time.time() - t0)
            if sleep_t > 0:
                time.sleep(sleep_t)

        cap.release()
        logger.info("Webcam released")

    # ── Public API ────────────────────────────────────────────────────────────
    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop_evt.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        logger.info("EmotionEngine started")

    def stop(self):
        self._stop_evt.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("EmotionEngine stopped")

    def get_latest(self) -> dict:
        with self._lock:
            return dict(self.latest)


# Singleton instance
engine = EmotionEngine(webcam_index=0, target_fps=10)
