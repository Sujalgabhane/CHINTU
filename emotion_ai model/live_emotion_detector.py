"""
live_emotion_detector.py - Real-time emotion detection from webcam (PyTorch)
Author: Emotion AI System

Usage:
    python live_emotion_detector.py

Keyboard shortcuts:
    Q  - quit
    S  - save screenshot
    R  - start / stop recording
    E  - toggle low-light enhancement
    H  - toggle help overlay
"""

import os
import sys
import csv
import time
import datetime
import threading
import numpy as np
import cv2

import torch
import torch.nn.functional as F

from utils import (
    EMOTIONS, NUM_CLASSES, MODEL_PATH,
    SCREENSHOTS_DIR, RECORDINGS_DIR, LOGS_DIR,
    EMOTION_COLORS, ensure_dirs,
    preprocess_face, enhance_low_light,
    MovingAverage, draw_probability_bars, draw_fps, get_logger
)

ensure_dirs()
logger = get_logger("live_detector",
                    log_file=os.path.join(LOGS_DIR, "live_detector.log"))

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ─────────────────────────────────────────────
# FACE DETECTOR
# ─────────────────────────────────────────────

class FaceDetector:
    """Haar Cascade multi-face detector."""

    def __init__(self):
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.cascade = cv2.CascadeClassifier(cascade_path)

    def detect(self, frame_bgr: np.ndarray) -> list:
        """Return list of (x, y, w, h) bounding boxes."""
        gray  = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        gray  = cv2.equalizeHist(gray)
        faces = self.cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=5,
            minSize=(60, 60),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        return faces.tolist() if len(faces) > 0 else []


# ─────────────────────────────────────────────
# EMOTION PREDICTOR
# ─────────────────────────────────────────────

class EmotionPredictor:
    """Wraps EmotionNet for real-time inference with temporal smoothing."""

    def __init__(self, model_path: str, smoothing_window: int = 10):
        if not os.path.exists(model_path):
            logger.error(f"Model not found: {model_path}")
            logger.error("Run train_model.py first!")
            sys.exit(1)

        from train_model import EmotionNet
        model = EmotionNet(num_classes=NUM_CLASSES)
        model.load_state_dict(torch.load(model_path, map_location=DEVICE))
        model.to(DEVICE)
        model.eval()
        self.model   = model
        self.smoother = MovingAverage(window=smoothing_window)
        logger.info(f"Model loaded from {model_path} on {DEVICE}")

    @torch.no_grad()
    def predict(self, face_bgr: np.ndarray) -> tuple:
        """
        Returns:
            smoothed_probs : np.ndarray (NUM_CLASSES,)
            top_emotion    : str
            confidence     : float
        """
        tensor    = preprocess_face(face_bgr).to(DEVICE)
        logits    = self.model(tensor)
        raw_probs = F.softmax(logits, dim=1).cpu().numpy()[0]
        smoothed  = self.smoother.update(raw_probs)
        top_idx   = int(np.argmax(smoothed))
        return smoothed, EMOTIONS[top_idx], float(smoothed[top_idx])


# ─────────────────────────────────────────────
# EMOTION LOGGER (CSV)
# ─────────────────────────────────────────────

class EmotionLogger:
    """Appends emotion predictions to a timestamped CSV file."""

    def __init__(self):
        ts    = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.path   = os.path.join(LOGS_DIR, f"emotion_log_{ts}.csv")
        self._file  = open(self.path, "w", newline="")
        self._writer = csv.writer(self._file)
        self._writer.writerow(["timestamp", "emotion", "confidence"] + EMOTIONS)
        logger.info(f"Emotion log: {self.path}")

    def log(self, emotion: str, confidence: float, probs: np.ndarray):
        ts  = datetime.datetime.now().isoformat()
        row = [ts, emotion, f"{confidence:.4f}"] + [f"{p:.4f}" for p in probs]
        self._writer.writerow(row)
        self._file.flush()

    def close(self):
        self._file.close()


# ─────────────────────────────────────────────
# VIDEO RECORDER
# ─────────────────────────────────────────────

class VideoRecorder:
    """Thread-safe AVI video recorder."""

    def __init__(self, fps: float = 20.0, frame_size: tuple = (1280, 720)):
        self._writer    = None
        self._path      = None
        self._fps       = fps
        self._frame_size = frame_size
        self._lock      = threading.Lock()
        self.recording  = False

    def start(self):
        ts    = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self._path   = os.path.join(RECORDINGS_DIR, f"session_{ts}.avi")
        fourcc       = cv2.VideoWriter_fourcc(*"XVID")
        self._writer = cv2.VideoWriter(self._path, fourcc, self._fps, self._frame_size)
        self.recording = True
        logger.info(f"Recording started -> {self._path}")

    def write(self, frame: np.ndarray):
        if self.recording and self._writer:
            with self._lock:
                h, w = frame.shape[:2]
                if (w, h) != self._frame_size:
                    frame = cv2.resize(frame, self._frame_size)
                self._writer.write(frame)

    def stop(self):
        if self._writer:
            with self._lock:
                self._writer.release()
                self._writer = None
        self.recording = False
        logger.info(f"Recording saved -> {self._path}")


# ─────────────────────────────────────────────
# UI DRAWING
# ─────────────────────────────────────────────

def draw_face_box(frame, x, y, w, h, emotion, confidence, color):
    """Bounding box + emotion label above the face."""
    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
    label = f"{emotion}  {confidence*100:.1f}%"
    font  = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.70
    thick = 2
    (tw, th), _ = cv2.getTextSize(label, font, scale, thick)
    cv2.rectangle(frame, (x, y - th - 12), (x + tw + 8, y), (20, 20, 20), -1)
    cv2.putText(frame, label, (x + 4, y - 6), font, scale, color, thick, cv2.LINE_AA)


def draw_status_bar(frame, enhance_on, recording, _help_on):
    h, w = frame.shape[:2]
    cv2.rectangle(frame, (0, h - 32), (w, h), (20, 20, 20), -1)
    hints = [
        "[Q] Quit",
        "[S] Screenshot",
        f"[R] Rec {'REC' if recording else 'off'}",
        f"[E] Enhance {'ON' if enhance_on else 'OFF'}",
        "[H] Help",
    ]
    x = 8
    for hint in hints:
        color = (0, 200, 100) if ("ON" in hint or "REC" in hint) else (180, 180, 180)
        cv2.putText(frame, hint, (x, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
        x += 160


def draw_help_overlay(frame):
    overlay = frame.copy()
    h, w    = frame.shape[:2]
    cv2.rectangle(overlay, (w//4, h//4), (3*w//4, 3*h//4), (30, 30, 30), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
    lines = [
        "KEYBOARD SHORTCUTS",
        "",
        "Q  -  Quit application",
        "S  -  Save screenshot",
        "R  -  Start / Stop recording",
        "E  -  Toggle low-light enhance",
        "H  -  Toggle this help screen",
    ]
    for i, line in enumerate(lines):
        color = (0, 220, 255) if i == 0 else (220, 220, 220)
        scale = 0.7 if i == 0 else 0.55
        cv2.putText(frame, line,
                    (w//4 + 20, h//4 + 40 + i * 32),
                    cv2.FONT_HERSHEY_SIMPLEX, scale, color, 1, cv2.LINE_AA)


def draw_title(frame):
    cv2.rectangle(frame, (0, 0), (frame.shape[1], 42), (20, 20, 20), -1)
    cv2.putText(frame, "EMOTION AI  |  Real-Time Detector",
                (10, 29), cv2.FONT_HERSHEY_SIMPLEX,
                0.78, (0, 200, 255), 2, cv2.LINE_AA)


# ─────────────────────────────────────────────
# CONFIDENCE HISTORY GRAPH
# ─────────────────────────────────────────────

HISTORY_LEN = 100


class ConfidenceGraph:
    """Scrolling mini-graph showing top-emotion confidence over time."""

    def __init__(self, width=250, height=80):
        self.w       = width
        self.h       = height
        self.history = []

    def update(self, confidence: float):
        self.history.append(confidence)
        if len(self.history) > HISTORY_LEN:
            self.history.pop(0)

    def draw(self, frame, x_offset=10, y_offset=None):
        if y_offset is None:
            y_offset = frame.shape[0] - 130

        canvas = np.full((self.h, self.w, 3), 25, dtype=np.uint8)
        cv2.rectangle(canvas, (0, 0), (self.w - 1, self.h - 1), (60, 60, 60), 1)

        if len(self.history) > 1:
            pts = []
            for i, val in enumerate(self.history):
                px = int(i * (self.w / HISTORY_LEN))
                py = int(self.h - val * self.h)
                pts.append((px, py))
            for i in range(1, len(pts)):
                cv2.line(canvas, pts[i - 1], pts[i], (0, 200, 255), 1)

        cv2.putText(canvas, "Confidence", (4, 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, (180, 180, 180), 1)

        frame[y_offset:y_offset + self.h, x_offset:x_offset + self.w] = \
            cv2.addWeighted(
                frame[y_offset:y_offset + self.h, x_offset:x_offset + self.w],
                0.3, canvas, 0.7, 0
            )
        return frame


# ─────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────

def main():
    ensure_dirs()

    logger.info("=" * 55)
    logger.info("  EMOTION AI  -  LIVE DETECTOR  (PyTorch)")
    logger.info("=" * 55)

    predictor      = EmotionPredictor(MODEL_PATH)
    face_detector  = FaceDetector()
    emotion_logger = EmotionLogger()
    recorder       = VideoRecorder()
    conf_graph     = ConfidenceGraph()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error("Could not open webcam.")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)

    print("Webcam working successfully")
    logger.info("Webcam working successfully")

    enhance_on  = False
    help_on     = False
    fps_timer   = time.time()
    fps         = 0.0
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            logger.error("Failed to read frame from webcam.")
            break

        if enhance_on:
            frame = enhance_low_light(frame)

        frame_count += 1
        elapsed = time.time() - fps_timer
        if elapsed >= 0.5:
            fps = frame_count / elapsed
            frame_count = 0
            fps_timer = time.time()

        # ── Face detection ────────────────────────────────────
        faces = face_detector.detect(frame)
        dominant_emotion    = None
        dominant_confidence = 0.0
        dominant_probs      = np.zeros(NUM_CLASSES)

        if faces:
            print("Face detected", end="\r")

        for fi, (x, y, w, h) in enumerate(faces[:6]):
            margin = 20
            H, W   = frame.shape[:2]
            fx1 = max(0, x - margin)
            fy1 = max(0, y - margin)
            fx2 = min(W, x + w + margin)
            fy2 = min(H, y + h + margin)
            face_crop = frame[fy1:fy2, fx1:fx2]

            if face_crop.size == 0:
                continue

            try:
                probs, emotion, confidence = predictor.predict(face_crop)
            except Exception as e:
                logger.warning(f"Prediction error: {e}")
                continue

            if fi == 0:
                dominant_emotion    = emotion
                dominant_confidence = confidence
                dominant_probs      = probs
                emotion_logger.log(emotion, confidence, probs)
                conf_graph.update(confidence)
                print(f"Emotion prediction active: {emotion} ({confidence*100:.1f}%)    ",
                      end="\r")

            box_color = EMOTION_COLORS.get(emotion, (200, 200, 200))
            draw_face_box(frame, x, y, w, h, emotion, confidence, box_color)

        # ── UI ────────────────────────────────────────────────
        draw_title(frame)
        draw_fps(frame, fps)

        if dominant_emotion is not None:
            frame = draw_probability_bars(
                frame, dominant_probs, EMOTIONS,
                x_offset=10, y_start=55
            )
            frame = conf_graph.draw(frame, x_offset=10)

        draw_status_bar(frame, enhance_on, recorder.recording, help_on)

        if help_on:
            draw_help_overlay(frame)

        if recorder.recording:
            recorder.write(frame)

        cv2.imshow("Emotion AI - Real-Time Detector", frame)

        # ── Key handling ─────────────────────────────────────
        key = cv2.waitKey(1) & 0xFF

        if key in (ord("q"), ord("Q")):
            logger.info("Quit requested.")
            break
        elif key in (ord("s"), ord("S")):
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            ss = os.path.join(SCREENSHOTS_DIR, f"screenshot_{ts}.png")
            cv2.imwrite(ss, frame)
            logger.info(f"Screenshot saved: {ss}")
        elif key in (ord("r"), ord("R")):
            recorder.stop() if recorder.recording else recorder.start()
        elif key in (ord("e"), ord("E")):
            enhance_on = not enhance_on
            logger.info(f"Low-light enhance: {'ON' if enhance_on else 'OFF'}")
        elif key in (ord("h"), ord("H")):
            help_on = not help_on

    # ── Cleanup ───────────────────────────────────────────────
    if recorder.recording:
        recorder.stop()
    emotion_logger.close()
    cap.release()
    cv2.destroyAllWindows()
    logger.info("Live detector stopped.")
    print("\nLive detector stopped.")


if __name__ == "__main__":
    main()
